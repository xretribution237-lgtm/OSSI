/**
 * jail/manager.js
 *
 * Handles:
 *  - sentence()        /sentence  — formal sentence from court
 *  - offense()         /offense   — strike system (lawful order / conduct / treason)
 *  - adjustSentence()  /adjust    — lengthen, shorten, release
 *  - ticker            — live countdown in cell channels every minute
 *  - autoTransfer      — moves holding → jail when a cell opens
 */

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msToHuman(ms) {
  if (ms <= 0) return "0 seconds";
  const parts = [];
  const y = Math.floor(ms / 31_536_000_000); if (y) parts.push(`${y}y`);
  const mo = Math.floor((ms % 31_536_000_000) / 2_592_000_000); if (mo) parts.push(`${mo}mo`);
  const w = Math.floor((ms % 2_592_000_000) / 604_800_000); if (w) parts.push(`${w}w`);
  const d = Math.floor((ms % 604_800_000) / 86_400_000); if (d) parts.push(`${d}d`);
  const h = Math.floor((ms % 86_400_000) / 3_600_000); if (h) parts.push(`${h}h`);
  const m = Math.floor((ms % 3_600_000) / 60_000); if (m) parts.push(`${m}m`);
  return parts.join(" ") || "< 1 minute";
}

function parseDuration(str) {
  // e.g. "1Y", "3D", "2H", "1M" (months), "1W"
  const map = { Y: 31_536_000_000, MO: 2_592_000_000, W: 604_800_000, D: 86_400_000, H: 3_600_000 };
  const match = str.toUpperCase().match(/^(\d+)(Y|MO|W|D|H)$/);
  if (!match) return null;
  return parseInt(match[1]) * (map[match[2]] || 0);
}

// ─── Post / update the cell embed ────────────────────────────────────────────

async function postCellEmbed(client, entry, isHolding = false) {
  const channel = client.channels.cache.get(entry.channelId);
  if (!channel) return;

  const now      = Date.now();
  const endsAt   = Math.floor(entry.endsAt / 1000);
  const remaining = entry.endsAt - now;

  const embed = new EmbedBuilder()
    .setTitle(isHolding ? "🔒 HOLDING CELL — AWAITING TRANSFER" : "⛓️ DETENTION — SENTENCE IN PROGRESS")
    .setDescription(
      isHolding
        ? `<@${entry.userId}> — You are currently in a **holding cell** pending transfer to a detention cell.\n\n` +
          `All three cells are currently occupied. You will be transferred automatically when one becomes available.\n\n` +
          `Your sentence clock begins the moment you are transferred.`
        : `<@${entry.userId}> — You have been placed in detention by order of the **OSSI Jurisdiction Court**.\n\n` +
          `You may not interact with any server channels until your sentence concludes or a senior operative intervenes.\n\n` +
          `*Any attempt to circumvent your sentence will result in immediate escalation.*`
    )
    .setColor(isHolding ? 0x4a3000 : 0x1a0000)
    .addFields(
      { name: "Operative",   value: `<@${entry.userId}>`,       inline: true },
      { name: "Sentenced By",value: `<@${entry.sentencedBy}>`,  inline: true },
      { name: "Reason",      value: entry.reason,               inline: false },
      isHolding
        ? { name: "Status",  value: "⏳ Awaiting cell transfer", inline: true }
        : { name: "Release", value: `<t:${endsAt}:R> (<t:${endsAt}:F>)`, inline: true },
      isHolding
        ? { name: "Sentence Length", value: msToHuman(entry.endsAt), inline: true }
        : { name: "Time Remaining",  value: msToHuman(remaining),     inline: true },
    )
    .setFooter({ text: "OSSI – Jurisdiction Court  •  Sentence is binding" })
    .setTimestamp();

  if (entry.embedMessageId) {
    try {
      const existing = await channel.messages.fetch(entry.embedMessageId);
      await existing.edit({ embeds: [embed] });
      return;
    } catch { /* message gone, repost */ }
  }

  const msg = await channel.send({ content: `<@${entry.userId}>`, embeds: [embed] });
  entry.embedMessageId = msg.id;
}

// ─── Grant jailed member access to ONLY their cell ───────────────────────────

async function lockToCell(guild, userId, channelId) {
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;
  await channel.permissionOverwrites.edit(userId, {
    ViewChannel        : true,
    ReadMessageHistory : true,
    SendMessages       : false,
  });
}

async function removeFromCell(guild, userId, channelId) {
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;
  try { await channel.permissionOverwrites.delete(userId); } catch {}
}

// ─── Strip all roles, save them, grant jail role ─────────────────────────────

async function imprisonMember(member) {
  const savedRoles = member.roles.cache
    .filter(r => r.id !== member.guild.roles.everyone.id && r.id !== config.JAIL_ROLE_ID)
    .map(r => r.id);

  // Remove all roles except @everyone
  for (const roleId of savedRoles) {
    try { await member.roles.remove(roleId); } catch {}
  }

  // Grant jail role
  const jailRole = member.guild.roles.cache.get(config.JAIL_ROLE_ID);
  if (jailRole) await member.roles.add(jailRole);

  return savedRoles;
}

// ─── Restore roles, remove jail role ─────────────────────────────────────────

async function freeMember(member, savedRoles) {
  const jailRole = member.guild.roles.cache.get(config.JAIL_ROLE_ID);
  if (jailRole) await member.roles.remove(jailRole).catch(() => {});

  for (const roleId of savedRoles) {
    try { await member.roles.add(roleId); } catch {}
  }
}

// ─── Find a free jail cell slot ───────────────────────────────────────────────

function freeCellIndex() {
  return config.state.jailCells.findIndex(c => c === null);
}

function freeHoldingIndex() {
  return config.state.holdingCells.findIndex(c => c === null);
}

// ─── Post announcement to announcements channel ───────────────────────────────

async function postAnnouncement(client, embed) {
  const ch = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (ch) await ch.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: sentence()  (/sentence command)
// ─────────────────────────────────────────────────────────────────────────────

async function sentence(interaction, client) {
  const target    = interaction.options.getMember("who");
  const reason    = interaction.options.getString("reason");
  const durationStr = interaction.options.getString("length");

  const durationMs = parseDuration(durationStr);
  if (!durationMs) {
    return interaction.reply({ content: "❌ Invalid duration format. Use e.g. `1D`, `2H`, `1Y`, `3W`.", flags: 64 });
  }

  const guild  = interaction.guild;
  const cellIdx    = freeCellIndex();
  const holdingIdx = freeHoldingIndex();

  if (cellIdx === -1 && holdingIdx === -1) {
    return interaction.reply({ content: "❌ All detention cells AND holding cells are full. Release someone first.", flags: 64 });
  }

  await interaction.deferReply({ flags: 64 });

  const savedRoles = await imprisonMember(target);
  const now        = Date.now();
  const isHolding  = cellIdx === -1;

  const entry = {
    userId       : target.id,
    sentencedBy  : interaction.user.id,
    reason,
    savedRoles,
    durationMs,
    startedAt    : isHolding ? null : now,           // null = hasn't started yet
    endsAt       : isHolding ? durationMs : now + durationMs, // for holding: store raw ms
    channelId    : isHolding
      ? config.state.holdingChannelIds[holdingIdx]
      : config.state.cellChannelIds[cellIdx],
    embedMessageId : null,
    isHolding,
  };

  if (isHolding) {
    config.state.holdingCells[holdingIdx] = entry;
  } else {
    config.state.jailCells[cellIdx] = entry;
  }

  await lockToCell(guild, target.id, entry.channelId);
  await postCellEmbed(client, entry, isHolding);

  // DM the sentenced member
  const dmEmbed = new EmbedBuilder()
    .setTitle("⛓️ SENTENCE ISSUED — OSSI JURISDICTION COURT")
    .setDescription(
      `You have been formally sentenced by **${interaction.user.tag}**.\n\n` +
      `**Reason:** ${reason}\n` +
      `**Duration:** ${msToHuman(durationMs)}\n\n` +
      (isHolding
        ? "All cells are currently occupied. You have been placed in a **holding cell** and will be transferred when a cell opens.\n\n"
        : `Your sentence began immediately. You will be released <t:${Math.floor((now + durationMs) / 1000)}:R>.\n\n`) +
      "*All server access has been suspended for the duration of your sentence.*"
    )
    .setColor(0x1a0000)
    .setFooter({ text: "OSSI – Jurisdiction Court" })
    .setTimestamp();

  try { await target.send({ embeds: [dmEmbed] }); } catch {}

  // Announcement
  const announceEmbed = new EmbedBuilder()
    .setTitle("⚖️ SENTENCE ISSUED")
    .addFields(
      { name: "Operative",    value: `<@${target.id}>`,           inline: true },
      { name: "Sentenced By", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Duration",     value: msToHuman(durationMs),       inline: true },
      { name: "Status",       value: isHolding ? "🔒 Holding Cell" : "⛓️ Cell " + (cellIdx + 1), inline: true },
      { name: "Reason",       value: reason,                      inline: false },
    )
    .setColor(0x1a0000)
    .setFooter({ text: "OSSI – Jurisdiction Court  •  Binding Order" })
    .setTimestamp();

  await postAnnouncement(client, announceEmbed);

  await interaction.followUp({ content: `✅ **${target.displayName}** has been sentenced to ${msToHuman(durationMs)} — placed in ${isHolding ? "holding cell" : `cell ${cellIdx + 1}`}.`, flags: 64 });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: offense()  (/offense command — strike system)
// ─────────────────────────────────────────────────────────────────────────────

async function offense(interaction, client) {
  const target  = interaction.options.getMember("who");
  const reason  = interaction.options.getString("reason"); // "breaking lawful order" | "inappropriate use of conduct" | "treason"

  const guild  = interaction.guild;
  const userId = target.id;

  // ── Treason: automatic 1 year sentence ──────────────────────────────────
  if (reason === "treason") {
    const treasonEmbed = new EmbedBuilder()
      .setTitle("🚨 TREASON CHARGE — AUTOMATIC MAXIMUM SENTENCE")
      .setDescription(
        `<@${userId}> has been charged with **TREASON** against the OSSI.\n\n` +
        `An automatic sentence of **1 Year** has been issued by standing order.\n\n` +
        `*This sentence cannot be shortened without direct Founder authorisation.*`
      )
      .setColor(0x4a0000)
      .setFooter({ text: "OSSI – Jurisdiction Court  •  TREASON" })
      .setTimestamp();

    await interaction.reply({ embeds: [treasonEmbed] });

    // Fake an interaction-like call to sentence()
    const cellIdx    = freeCellIndex();
    const holdingIdx = freeHoldingIndex();

    if (cellIdx === -1 && holdingIdx === -1) return;

    const now      = Date.now();
    const durationMs = 31_536_000_000; // 1 year
    const isHolding  = cellIdx === -1;

    const savedRoles = await imprisonMember(target);

    const entry = {
      userId,
      sentencedBy  : interaction.user.id,
      reason       : "TREASON against the OSSI",
      savedRoles,
      durationMs,
      startedAt    : isHolding ? null : now,
      endsAt       : isHolding ? durationMs : now + durationMs,
      channelId    : isHolding
        ? config.state.holdingChannelIds[holdingIdx]
        : config.state.cellChannelIds[cellIdx],
      embedMessageId : null,
      isHolding,
    };

    if (isHolding) config.state.holdingCells[holdingIdx] = entry;
    else           config.state.jailCells[cellIdx]       = entry;

    await lockToCell(guild, userId, entry.channelId);
    await postCellEmbed(client, entry, isHolding);
    await postAnnouncement(client, treasonEmbed);

    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("⛓️ TREASON — AUTOMATIC 1-YEAR SENTENCE")
        .setDescription(`You have been charged with **TREASON** against the OSSI.\n\nAn automatic sentence of 1 year has been applied. All server access has been suspended.`)
        .setColor(0x4a0000).setTimestamp();
      await target.send({ embeds: [dmEmbed] });
    } catch {}

    return;
  }

  // ── Strike offenses (breaking lawful order / inappropriate use of conduct) ──
  const log = config.state.strikeLog;
  if (!log[userId]) log[userId] = { count: 0, offenses: [] };

  log[userId].count++;
  log[userId].offenses.push({ reason, by: interaction.user.id, at: Date.now() });

  const strikes = log[userId].count;
  const strikeBar = "🟥".repeat(strikes) + "⬛".repeat(config.MAX_STRIKES - strikes);

  await interaction.deferReply({ flags: 64 });

  // Announce the strike
  const strikeEmbed = new EmbedBuilder()
    .setTitle(`⚠️ FORMAL OFFENSE ISSUED — STRIKE ${strikes}/${config.MAX_STRIKES}`)
    .setDescription(
      `<@${userId}> has received a formal offense on record.\n\n` +
      `**Offense:** ${reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}\n` +
      `**Issued By:** <@${interaction.user.id}>\n\n` +
      `**Strike Record:** ${strikeBar}  (${strikes}/${config.MAX_STRIKES})\n\n` +
      (strikes < config.MAX_STRIKES
        ? `⚠️ *${config.MAX_STRIKES - strikes} strike(s) remaining before automatic sentencing.*`
        : `🚨 *Maximum strikes reached. Automatic 3-hour sentence triggered.*`)
    )
    .setColor(strikes >= config.MAX_STRIKES ? 0x4a0000 : 0x8b4500)
    .setFooter({ text: "OSSI – Jurisdiction Court  •  Strike Record" })
    .setTimestamp();

  const jurisdictionCh = client.channels.cache.get(config.MEETING_CHANNELS.JURISDICTION);
  if (jurisdictionCh) await jurisdictionCh.send({ embeds: [strikeEmbed] });
  await postAnnouncement(client, strikeEmbed);

  // DM the member
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle(`⚠️ Formal Offense — Strike ${strikes}/${config.MAX_STRIKES}`)
      .setDescription(
        `You have received a formal offense from **${interaction.user.tag}**.\n\n` +
        `**Reason:** ${reason.replace(/_/g, " ")}\n` +
        `**Your Strikes:** ${strikeBar}\n\n` +
        (strikes < config.MAX_STRIKES
          ? `You have ${config.MAX_STRIKES - strikes} strike(s) remaining.`
          : `You have reached the maximum. A 3-hour holding sentence has been triggered.`)
      )
      .setColor(0x8b4500).setTimestamp();
    await target.send({ embeds: [dmEmbed] });
  } catch {}

  // ── 3 strikes = auto 3-hour sentence ────────────────────────────────────
  if (strikes >= config.MAX_STRIKES) {
    const cellIdx    = freeCellIndex();
    const holdingIdx = freeHoldingIndex();

    if (cellIdx !== -1 || holdingIdx !== -1) {
      const now        = Date.now();
      const durationMs = config.STRIKE_SENTENCE_MS;
      const isHolding  = cellIdx === -1;

      const savedRoles = await imprisonMember(target);

      const entry = {
        userId,
        sentencedBy  : "auto",
        reason       : `3 strikes — ${reason.replace(/_/g, " ")}`,
        savedRoles,
        durationMs,
        startedAt    : isHolding ? null : now,
        endsAt       : isHolding ? durationMs : now + durationMs,
        channelId    : isHolding
          ? config.state.holdingChannelIds[holdingIdx]
          : config.state.cellChannelIds[cellIdx],
        embedMessageId : null,
        isHolding,
        autoStrike   : true,
      };

      if (isHolding) config.state.holdingCells[holdingIdx] = entry;
      else           config.state.jailCells[cellIdx]       = entry;

      await lockToCell(guild, userId, entry.channelId);
      await postCellEmbed(client, entry, isHolding);
    }

    // Reset strikes after sentence triggered
    log[userId] = { count: 0, offenses: [] };
  }

  await interaction.followUp({ content: `✅ Offense recorded for **${target.displayName}**. Strike ${strikes}/${config.MAX_STRIKES}.`, flags: 64 });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: adjustSentence()  (/adjust command)
// ─────────────────────────────────────────────────────────────────────────────

async function adjustSentence(interaction, client) {
  const target = interaction.options.getMember("who");
  const action = interaction.options.getString("action"); // "lengthen" | "shorten" | "release"
  const amountStr = interaction.options.getString("amount"); // optional for release

  const userId = target.id;
  const guild  = interaction.guild;

  // Find them in a cell or holding
  let entry = null;
  let cellArr = null;
  let idx = -1;

  for (let i = 0; i < config.state.jailCells.length; i++) {
    if (config.state.jailCells[i]?.userId === userId) {
      entry = config.state.jailCells[i]; cellArr = config.state.jailCells; idx = i; break;
    }
  }
  if (!entry) {
    for (let i = 0; i < config.state.holdingCells.length; i++) {
      if (config.state.holdingCells[i]?.userId === userId) {
        entry = config.state.holdingCells[i]; cellArr = config.state.holdingCells; idx = i; break;
      }
    }
  }

  if (!entry) {
    return interaction.reply({ content: `❌ **${target.displayName}** is not currently detained.`, flags: 64 });
  }

  await interaction.deferReply({ flags: 64 });

  if (action === "release") {
    await releaseEntry(entry, idx, cellArr, guild, client, interaction.user.id, "Released early by senior staff");
    return interaction.followUp({ content: `✅ **${target.displayName}** has been released.`, flags: 64 });
  }

  const deltaMs = parseDuration(amountStr || "");
  if (!deltaMs) return interaction.followUp({ content: "❌ Provide a valid amount e.g. `2H`, `1D`.", flags: 64 });

  if (action === "lengthen") {
    entry.endsAt += deltaMs;
    entry.durationMs += deltaMs;
  } else if (action === "shorten") {
    entry.endsAt = Math.max(Date.now() + 60_000, entry.endsAt - deltaMs);
    entry.durationMs = Math.max(60_000, entry.durationMs - deltaMs);
  }

  await postCellEmbed(client, entry, entry.isHolding);

  const adjustEmbed = new EmbedBuilder()
    .setTitle(`⚖️ SENTENCE ${action.toUpperCase()}ED`)
    .addFields(
      { name: "Operative",  value: `<@${userId}>`,              inline: true },
      { name: "Action",     value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
      { name: "Amount",     value: msToHuman(deltaMs),          inline: true },
      { name: "New Release",value: `<t:${Math.floor(entry.endsAt / 1000)}:R>`, inline: true },
      { name: "By",         value: `<@${interaction.user.id}>`, inline: true },
    )
    .setColor(0x1a0000)
    .setFooter({ text: "OSSI – Jurisdiction Court" })
    .setTimestamp();

  await postAnnouncement(client, adjustEmbed);
  await interaction.followUp({ content: `✅ Sentence for **${target.displayName}** has been ${action}ed by ${msToHuman(deltaMs)}.`, flags: 64 });
}

// ─── Release a single entry from a cell ──────────────────────────────────────

async function releaseEntry(entry, idx, cellArr, guild, client, releasedById = null, releaseReason = "Sentence complete") {
  let member;
  try { member = await guild.members.fetch(entry.userId); } catch { cellArr[idx] = null; return; }

  await freeMember(member, entry.savedRoles);
  await removeFromCell(guild, entry.userId, entry.channelId);

  // Update cell embed to released
  try {
    const ch  = client.channels.cache.get(entry.channelId);
    const msg = ch ? await ch.messages.fetch(entry.embedMessageId).catch(() => null) : null;
    if (msg) {
      const relEmbed = new EmbedBuilder()
        .setTitle("✅ SENTENCE CONCLUDED — OPERATIVE RELEASED")
        .setDescription(`<@${entry.userId}> — Your sentence has concluded. You have been released and your roles have been restored.\n\n*Your file remains on record.*`)
        .setColor(0x00b894)
        .addFields(
          { name: "Operative",    value: `<@${entry.userId}>`,                           inline: true },
          { name: "Released By",  value: releasedById ? `<@${releasedById}>` : "System", inline: true },
          { name: "Reason",       value: releaseReason,                                  inline: true },
        )
        .setFooter({ text: "OSSI – Jurisdiction Court  •  File Remains On Record" })
        .setTimestamp();
      await msg.edit({ embeds: [relEmbed] });
    }
  } catch {}

  // DM
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("✅ Released from Detention")
      .setDescription(`Your sentence has concluded and your roles have been fully restored.\n\n*${releaseReason}*`)
      .setColor(0x00b894).setTimestamp();
    await member.send({ embeds: [dmEmbed] });
  } catch {}

  cellArr[idx] = null;

  // Announce
  const announceEmbed = new EmbedBuilder()
    .setTitle("✅ OPERATIVE RELEASED")
    .addFields(
      { name: "Operative", value: `<@${entry.userId}>`, inline: true },
      { name: "Released",  value: releasedById ? `<@${releasedById}>` : "Auto", inline: true },
      { name: "Reason",    value: releaseReason, inline: false },
    )
    .setColor(0x00b894).setTimestamp()
    .setFooter({ text: "OSSI – Jurisdiction Court" });
  const annCh = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (annCh) await annCh.send({ embeds: [announceEmbed] }).catch(() => {});

  console.log(`🔓 Released: ${entry.userId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCHEDULER — 1-minute ticker: release expired sentences + auto-transfer
// ─────────────────────────────────────────────────────────────────────────────

function startJailScheduler(client) {
  setInterval(async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const now = Date.now();

    // ── Check jail cells ────────────────────────────────────────────────────
    for (let i = 0; i < config.state.jailCells.length; i++) {
      const entry = config.state.jailCells[i];
      if (!entry) continue;

      if (now >= entry.endsAt) {
        await releaseEntry(entry, i, config.state.jailCells, guild, client);

        // Auto-transfer oldest holding cell into this now-free cell
        const holdIdx = config.state.holdingCells.findIndex(h => h !== null);
        if (holdIdx !== -1) {
          const holdEntry = config.state.holdingCells[holdIdx];
          holdEntry.isHolding  = false;
          holdEntry.startedAt  = now;
          holdEntry.endsAt     = now + holdEntry.endsAt; // endsAt was raw ms
          holdEntry.channelId  = config.state.cellChannelIds[i];
          holdEntry.embedMessageId = null;

          config.state.jailCells[i]       = holdEntry;
          config.state.holdingCells[holdIdx] = null;

          // Grant access to the new cell, remove from holding
          await lockToCell(guild, holdEntry.userId, holdEntry.channelId);
          await removeFromCell(guild, holdEntry.userId,
            config.state.holdingChannelIds[holdIdx]);
          await postCellEmbed(client, holdEntry, false);

          // DM transfer notification
          try {
            const member = await guild.members.fetch(holdEntry.userId);
            const dmEmbed = new EmbedBuilder()
              .setTitle("⛓️ Transferred to Detention Cell")
              .setDescription(
                `A detention cell has opened. You have been transferred from holding and your **${msToHuman(holdEntry.durationMs)}** sentence has begun.\n\n` +
                `Release: <t:${Math.floor(holdEntry.endsAt / 1000)}:R>`
              )
              .setColor(0x1a0000).setTimestamp();
            await member.send({ embeds: [dmEmbed] });
          } catch {}

          console.log(`🔄 Transferred ${holdEntry.userId} from holding → cell ${i + 1}`);
        }
      } else {
        // Update countdown embed
        await postCellEmbed(client, entry, false).catch(() => {});
      }
    }
  }, 60_000); // every 60 seconds

  console.log("⏱️  Jail scheduler started (60-second interval).");
}

module.exports = {
  sentence,
  offense,
  adjustSentence,
  startJailScheduler,
  msToHuman,
  parseDuration,
};
