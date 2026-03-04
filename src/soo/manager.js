/**
 * soo/manager.js
 *
 * FIXES applied:
 *  1. SOO channel permissions — bot explicitly grants the recruit Send Messages
 *     so their reply can fire messageCreate. After signing, permission is removed.
 *  2. Message recovery — on startup, the bot scans the last 100 messages in the
 *     SOO channel and rebuilds sooLog from any embed it finds that still has
 *     "⏳ Awaiting Signature" in it. Survives bot restarts.
 *  3. Reply detection — also accepts plain messages (not just replies) in the
 *     SOO channel from pending recruits, since mobile Discord often drops the
 *     "reply" reference silently.
 *  4. The "wrong message" warning no longer fires when they send a plain message,
 *     since we now accept both plain messages AND correct replies.
 *  5. Username comparison trims all whitespace and ignores the #discriminator
 *     (some users paste "username#0" by habit).
 */

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const {
  SOO_CHANNEL_ID,
  RECRUIT_ROLE_ID,
  SOO_REMINDER_INTERVAL_MS,
  SOO_EXPIRY_MS,
  state,
} = require("../config");

// ─── Grant recruit Send Messages in SOO channel so their reply registers ──────
async function grantSooAccess(client, userId) {
  const ch = client.channels.cache.get(SOO_CHANNEL_ID);
  if (!ch) return;
  await ch.permissionOverwrites.edit(userId, {
    ViewChannel        : true,
    ReadMessageHistory : true,
    SendMessages       : true,   // ← must be true or messageCreate never fires
  }).catch(e => console.warn("⚠️  grantSooAccess:", e.message));
}

async function revokeSooAccess(client, userId) {
  const ch = client.channels.cache.get(SOO_CHANNEL_ID);
  if (!ch) return;
  // Remove their personal override — they fall back to role/everyone permissions
  await ch.permissionOverwrites.delete(userId).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
//  STARTUP RECOVERY — rebuild sooLog from existing embeds in the channel
// ─────────────────────────────────────────────────────────────────────────────
async function recoverSOOState(client) {
  const ch = client.channels.cache.get(SOO_CHANNEL_ID);
  if (!ch) return;

  let messages;
  try {
    messages = await ch.messages.fetch({ limit: 100 });
  } catch (e) {
    console.warn("⚠️  Could not fetch SOO channel messages:", e.message);
    return;
  }

  let recovered = 0;

  for (const msg of messages.values()) {
    if (!msg.author?.bot) continue;
    const embed = msg.embeds?.[0];
    if (!embed) continue;

    // Only look at unsigned SOO embeds
    const statusField = embed.fields?.find(f => f.name === "Status");
    if (!statusField || !statusField.value.includes("Awaiting")) continue;

    // Extract the user ID from the Operative field mention
    const opField = embed.fields?.find(f => f.name === "Operative");
    if (!opField) continue;
    const match = opField.value.match(/<@(\d+)>/);
    if (!match) continue;

    const userId = match[1];
    if (state.sooLog[userId]) continue; // already tracked this session

    // Extract deadline timestamp from the Deadline field
    const deadlineField = embed.fields?.find(f => f.name === "Deadline");
    let verifiedAt = msg.createdTimestamp; // fallback
    if (deadlineField) {
      const tsMatch = deadlineField.value.match(/<t:(\d+):/);
      if (tsMatch) {
        verifiedAt = parseInt(tsMatch[1]) * 1000 - SOO_EXPIRY_MS;
      }
    }

    // Re-fetch their username from guild
    const guild = client.guilds.cache.first();
    let username = userId;
    if (guild) {
      try {
        const member = await guild.members.fetch(userId);
        username = member.user.username;
        // Re-grant SOO channel access so they can still reply
        await grantSooAccess(client, userId);
      } catch { /* member left */ continue; }
    }

    state.sooLog[userId] = {
      messageId  : msg.id,
      username,
      verifiedAt,
      signed     : false,
    };

    recovered++;
    console.log(`🔄 Recovered SOO entry: ${username} (${userId})`);
  }

  if (recovered > 0) console.log(`✅ Recovered ${recovered} pending SOO entry/entries.`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. POST SOO EMBED
// ─────────────────────────────────────────────────────────────────────────────
async function postSOO(member, client) {
  const channel = client.channels.cache.get(SOO_CHANNEL_ID);
  if (!channel) {
    console.error("❌ SOO channel not found. Check SOO_CHANNEL_ID in config.");
    return;
  }

  // Grant them permission to send messages in the SOO channel
  await grantSooAccess(client, member.id);

  const expiryTimestamp = Math.floor((Date.now() + SOO_EXPIRY_MS) / 1000);

  const embed = new EmbedBuilder()
    .setTitle("— STATEMENT OF ORIGINALITY (S.O.O) —")
    .setDescription(
      `<@${member.id}> — your identity verification is pending final confirmation.\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "To complete your onboarding and unlock full server access, you must sign " +
      "your **Statement of Originality**.\n\n" +
      "**How to sign:**\n" +
      "> Send a message in this channel (or reply to this embed) with your exact **Discord username**.\n\n" +
      "⚠️ **Failure to sign within 72 hours will result in automatic removal from the server.**\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x1a0a0a)
    .addFields(
      { name: "Operative", value: `<@${member.id}>`,          inline: true },
      { name: "Status",    value: "⏳ Awaiting Signature",    inline: true },
      { name: "Deadline",  value: `<t:${expiryTimestamp}:R>`, inline: true },
    )
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  S.O.O Required" })
    .setTimestamp();

  const msg = await channel.send({ embeds: [embed] });

  state.sooLog[member.id] = {
    messageId  : msg.id,
    username   : member.user.username,
    verifiedAt : Date.now(),
    signed     : false,
  };

  console.log(`📋 SOO posted for ${member.user.tag} (${member.id}) — message ${msg.id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. HANDLE MESSAGE — fires on every messageCreate in SOO channel
// ─────────────────────────────────────────────────────────────────────────────
async function handleMessage(message, client) {
  if (message.channelId !== SOO_CHANNEL_ID) return;
  if (message.author.bot) return;

  const userId = message.author.id;
  const entry  = state.sooLog[userId];

  // Not a pending recruit
  if (!entry || entry.signed) return;

  // ── Accept EITHER a reply to their embed OR any plain message in this channel
  const isReplyToTheirEmbed = message.reference?.messageId === entry.messageId;
  const isPlainMessage      = !message.reference; // no reply at all
  const isReplyToSomething  = !!message.reference;

  // If they replied to someone else's message (not their embed), warn + delete
  if (isReplyToSomething && !isReplyToTheirEmbed) {
    const warning = await message.reply({
      embeds: [new EmbedBuilder()
        .setDescription(
          "⚠️ Please either **send a plain message** in this channel, or " +
          "**reply directly to your SOO embed** — not to another message."
        )
        .setColor(0x8b0000)],
    }).catch(() => null);
    if (warning) setTimeout(() => warning.delete().catch(() => {}), 8000);
    return;
  }

  // ── Username comparison ──────────────────────────────────────────────────
  // Strip whitespace, remove #discriminator if they pasted it (e.g. "user#1234")
  const raw       = message.content.trim();
  const submitted = raw.replace(/#\d{4}$/, "").trim().toLowerCase();
  const expected  = entry.username.toLowerCase();

  if (submitted !== expected) {
    // Give them a hint — show the first letter so they know what we're expecting
    const hint = entry.username[0] + "*".repeat(Math.max(0, entry.username.length - 1));
    const failEmbed = new EmbedBuilder()
      .setTitle("✗ Signature Mismatch")
      .setDescription(
        "The username you submitted does not match your Discord account.\n\n" +
        `**You sent:** \`${raw}\`\n` +
        `**Expected:** starts with \`${hint}\`\n\n` +
        "Please check your username (not your display name or nickname) and try again.\n\n" +
        "*Tip: Right-click your name in the member list → Copy Username*"
      )
      .setColor(0x8b0000)
      .setFooter({ text: "OSSI – Statement of Originality" })
      .setTimestamp();

    const failMsg = await message.reply({ embeds: [failEmbed] }).catch(() => null);
    if (failMsg) setTimeout(() => failMsg.delete().catch(() => {}), 14000);
    return;
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  entry.signed = true;

  // Revoke their send permission in the SOO channel (back to read-only)
  await revokeSooAccess(client, userId);

  // Edit the original SOO embed → signed
  try {
    const sooChannel = client.channels.cache.get(SOO_CHANNEL_ID);
    const origMsg    = await sooChannel.messages.fetch(entry.messageId);
    const signedAt   = Math.floor(Date.now() / 1000);

    const signedEmbed = new EmbedBuilder()
      .setTitle("— STATEMENT OF ORIGINALITY (S.O.O) —")
      .setDescription(
        `<@${userId}> — identity confirmed. Statement signed and on file.\n\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "This operative has signed their Statement of Originality. " +
        "Their identity has been verified and full server access has been granted.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      )
      .setColor(0x00b894)
      .addFields(
        { name: "Operative", value: `<@${userId}>`,          inline: true },
        { name: "Status",    value: "✅ Signed & Confirmed", inline: true },
        { name: "Signed",    value: `<t:${signedAt}:F>`,     inline: true },
      )
      .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  S.O.O On File" })
      .setTimestamp();

    await origMsg.edit({ embeds: [signedEmbed] });
  } catch (err) {
    console.warn("⚠️  Could not edit SOO embed after signing:", err.message);
  }

  // Success reply
  const successEmbed = new EmbedBuilder()
    .setTitle("✅ Statement of Originality Signed")
    .setDescription(
      `**${message.author.username}** — your signature has been recorded and verified.\n\n` +
      "You now have full access to the server.\n\n" +
      "*Welcome to OSSI. Your file is on record.*"
    )
    .setColor(0x00b894)
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence" })
    .setTimestamp();

  await message.reply({ embeds: [successEmbed] });
  console.log(`✅ SOO signed: ${message.author.tag} (${userId})`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. SCHEDULER — hourly reminders + 72h expiry
// ─────────────────────────────────────────────────────────────────────────────
function startScheduler(client) {
  setInterval(async () => {
    const now   = Date.now();
    const guild = client.guilds.cache.first();
    if (!guild) return;

    for (const [userId, entry] of Object.entries(state.sooLog)) {
      if (entry.signed) continue;

      let member;
      try {
        member = await guild.members.fetch(userId);
      } catch {
        delete state.sooLog[userId];
        continue;
      }

      const elapsed = now - entry.verifiedAt;

      // ── 72h expiry ───────────────────────────────────────────────────────
      if (elapsed >= SOO_EXPIRY_MS) {
        try {
          const sooChannel = client.channels.cache.get(SOO_CHANNEL_ID);
          if (sooChannel) {
            const origMsg = await sooChannel.messages.fetch(entry.messageId).catch(() => null);
            if (origMsg) {
              const expiredEmbed = new EmbedBuilder()
                .setTitle("— STATEMENT OF ORIGINALITY (S.O.O) —")
                .setDescription(
                  `<@${userId}> — **DEADLINE EXCEEDED. ACCESS REVOKED.**\n\n` +
                  "This operative failed to sign within the required 72-hour window. They have been removed."
                )
                .setColor(0x4a0000)
                .addFields(
                  { name: "Operative", value: entry.username,       inline: true },
                  { name: "Status",    value: "❌ Expired — Removed", inline: true },
                )
                .setFooter({ text: "OSSI – S.O.O Expired" })
                .setTimestamp();
              await origMsg.edit({ embeds: [expiredEmbed] });
            }
          }

          try {
            await member.send({ embeds: [new EmbedBuilder()
              .setTitle("⛔ OSSI Access Revoked")
              .setDescription(
                "You have been removed from **OSSI**.\n\n" +
                "You failed to sign your Statement of Originality within 72 hours. " +
                "Your clearance has been revoked."
              )
              .setColor(0x4a0000).setTimestamp()] });
          } catch {}

          const recruitRole = guild.roles.cache.get(RECRUIT_ROLE_ID);
          if (recruitRole && member.roles.cache.has(RECRUIT_ROLE_ID)) {
            await member.roles.remove(recruitRole, "SOO not signed within 72 hours.");
          }
          await member.kick("Failed to sign Statement of Originality within 72 hours.");
          await revokeSooAccess(client, userId);
          console.log(`⛔ Kicked (SOO expired): ${entry.username} (${userId})`);
        } catch (err) {
          console.error(`❌ Could not process SOO expiry for ${userId}:`, err.message);
        }
        delete state.sooLog[userId];
        continue;
      }

      // ── Hourly reminder ──────────────────────────────────────────────────
      const sooChannel = client.channels.cache.get(SOO_CHANNEL_ID);
      if (!sooChannel) continue;

      const hoursLeft = Math.floor((SOO_EXPIRY_MS - elapsed) / 3_600_000);
      const timeLabel = hoursLeft >= 24
        ? `${Math.floor(hoursLeft / 24)} day${Math.floor(hoursLeft / 24) === 1 ? "" : "s"}`
        : `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}`;

      const reminderEmbed = new EmbedBuilder()
        .setDescription(
          `<@${userId}> — ⚠️ **Your Statement of Originality is still unsigned.**\n\n` +
          `You have approximately **${timeLabel}** remaining before automatic removal.\n\n` +
          `Send your Discord username in this channel (or reply to your SOO embed) to sign.`
        )
        .setColor(0x8b4500)
        .setFooter({ text: "OSSI – S.O.O Reminder" })
        .setTimestamp();

      await sooChannel.send({ embeds: [reminderEmbed] }).catch(() => {});
      console.log(`🔔 SOO reminder: ${entry.username} — ${timeLabel} left`);
    }
  }, SOO_REMINDER_INTERVAL_MS);

  console.log("⏱️  SOO scheduler started (1-hour interval).");
}

module.exports = { postSOO, handleMessage, startScheduler, recoverSOOState };
