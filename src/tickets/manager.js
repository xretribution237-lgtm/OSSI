/**
 * tickets/manager.js
 *
 * FIXES:
 *  1. Button/modal IDs must be STATIC strings for Discord to route them correctly.
 *     The old handleTicketButton returned a boolean which the handler checked —
 *     but the interaction handler was calling the wrong check order. Now the
 *     handler checks customId directly.
 *  2. Added TICKET_LOG_CHANNEL_ID — every ticket open/close/claim is logged there.
 *  3. Panel re-check now deletes old panel before reposting so it never stacks.
 *  4. Modal min length reduced to 10 so it doesn't block short reasons.
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

const config = require("../config");

// ─── Post ticket panel ────────────────────────────────────────────────────────
async function postTicketPanel(client) {
  const ch = client.channels.cache.get(config.TICKET_CHANNEL_ID);
  if (!ch) { console.error("❌ Ticket channel not found:", config.TICKET_CHANNEL_ID); return; }

  // Delete any old panel from the bot so we always have a fresh one
  try {
    const recent = await ch.messages.fetch({ limit: 50 });
    for (const [, m] of recent) {
      if (m.author?.id === client.user.id && m.components?.length > 0) {
        await m.delete().catch(() => {});
      }
    }
  } catch {}

  const embed = new EmbedBuilder()
    .setTitle("🎫 OSSI SUPPORT & ASSISTANCE DESK")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "**Need assistance? You have come to the right place.**\n\n" +
      "This channel is the official point of contact for all support requests " +
      "within the **Office of Strategic Secret Intelligence**.\n\n" +
      "**You may open a ticket for:**\n" +
      "> 🔹 Role or access issues\n" +
      "> 🔹 Reporting conduct violations\n" +
      "> 🔹 Appeals against rulings or sentences\n" +
      "> 🔹 General inquiries or requests\n" +
      "> 🔹 Operational concerns or intelligence reports\n" +
      "> 🔹 Any matter requiring senior staff attention\n\n" +
      "**How it works:**\n" +
      "> **1.** Click **📂 Create Ticket** below\n" +
      "> **2.** A form will appear — describe your issue in full\n" +
      "> **3.** A private channel will be opened for you and senior staff only\n" +
      "> **4.** A senior operative will respond as soon as possible\n\n" +
      "⚠️ *Abuse of the ticket system is a formal offense under OSSI conduct policy.*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x0d1b2a)
    .setFooter({ text: "OSSI – Support Desk  •  All tickets are logged and reviewed by senior staff" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ossi_ticket_create")
      .setLabel("📂  Create Ticket")
      .setStyle(ButtonStyle.Primary),
  );

  await ch.send({ embeds: [embed], components: [row] });
  console.log("🎫 Ticket panel posted.");
}

// ─── Handle "Create Ticket" button → show modal ───────────────────────────────
async function handleTicketCreate(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId("ossi_ticket_modal")
    .setTitle("OSSI — Open a Support Ticket");

  const input = new TextInputBuilder()
    .setCustomId("ticket_reason")
    .setLabel("Describe your issue or request")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      "Please be as specific as possible.\n" +
      "Include relevant operatives, dates, or channel names if applicable."
    )
    .setMinLength(10)
    .setMaxLength(1000)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

// ─── Handle modal submit → create private channel ─────────────────────────────
async function handleTicketSubmit(interaction, client) {
  await interaction.deferReply({ flags: 64 });

  const reason  = interaction.fields.getTextInputValue("ticket_reason");
  const guild   = interaction.guild;
  const user    = interaction.user;
  const member  = interaction.member;

  config.state.ticketCounter++;
  const ticketNum  = String(config.state.ticketCounter).padStart(4, "0");
  const channelName = `ticket-${ticketNum}`;
  const openedAt    = Math.floor(Date.now() / 1000);

  // Find parent category of the ticket panel channel
  const panelCh  = guild.channels.cache.get(config.TICKET_CHANNEL_ID);
  const parentId = panelCh?.parentId ?? null;

  // Build permission overwrites
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    ...config.ALLOWED_ROLE_IDS.map(id => ({
      id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    })),
  ];

  let ticketCh;
  try {
    ticketCh = await guild.channels.create({
      name   : channelName,
      type   : ChannelType.GuildText,
      parent : parentId,
      topic  : `Ticket #${ticketNum} | Opened by ${user.tag} | ${new Date().toUTCString()}`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    console.error("❌ Could not create ticket channel:", err.message);
    return interaction.followUp({
      content: "❌ Failed to create your ticket channel. Please contact a senior operative directly.",
      flags: 64,
    });
  }

  // Store in state
  config.state.ticketLog[ticketCh.id] = {
    userId    : user.id,
    username  : user.tag,
    reason,
    openedAt  : Date.now(),
    status    : "open",
    ticketNum,
    claimedBy : null,
  };

  const staffPing = config.ALLOWED_ROLE_IDS.map(id => `<@&${id}>`).join(" ");

  // ── Ticket channel embed ──────────────────────────────────────────────────
  const ticketEmbed = new EmbedBuilder()
    .setTitle(`🎫 TICKET #${ticketNum} — OPEN`)
    .setDescription(
      `${staffPing}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `A support ticket has been opened and is awaiting review.\n\n` +
      `**Submitted By:** <@${user.id}>\n` +
      `**Opened:** <t:${openedAt}:F>\n\n` +
      `**Issue / Request:**\n>>> ${reason}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "*A senior operative will respond shortly. Please remain patient.*"
    )
    .setColor(0x0d3b2a)
    .setThumbnail(member.displayAvatarURL({ size: 128 }))
    .setFooter({ text: `OSSI Support Desk  •  Ticket #${ticketNum}  •  Status: OPEN` })
    .setTimestamp();

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ossi_ticket_claim_${ticketCh.id}`)
      .setLabel("✋  Claim Ticket")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ossi_ticket_close_${ticketCh.id}`)
      .setLabel("🔒  Close Ticket")
      .setStyle(ButtonStyle.Danger),
  );

  await ticketCh.send({ embeds: [ticketEmbed], components: [actionRow] });
  await ticketCh.send({
    content: `<@${user.id}> — Your ticket has been received. Please provide any additional details below and a senior operative will be with you shortly.`,
  });

  // ── Log to ticket log channel ─────────────────────────────────────────────
  await logTicketEvent(client, "open", {
    ticketNum,
    userId    : user.id,
    username  : user.tag,
    channelId : ticketCh.id,
    reason,
    openedAt,
  });

  await interaction.followUp({
    content: `✅ Your ticket has been created: ${ticketCh}`,
    flags: 64,
  });
}

// ─── Handle claim button ──────────────────────────────────────────────────────
async function handleTicketClaim(interaction, client, channelId) {
  if (!config.ALLOWED_ROLE_IDS.some(id => interaction.member.roles.cache.has(id))) {
    return interaction.reply({ content: "❌ Only senior staff can claim tickets.", flags: 64 });
  }

  const entry = config.state.ticketLog[channelId];
  if (entry) entry.claimedBy = interaction.user.id;

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setDescription(
        `✋ **${interaction.user.tag}** has claimed this ticket.\n\n` +
        `<@${entry?.userId ?? ""}> — your request is being handled.`
      )
      .setColor(0x0d3b2a)
      .setTimestamp()],
  });

  await logTicketEvent(client, "claim", {
    ticketNum : entry?.ticketNum ?? "????",
    channelId,
    claimedBy : interaction.user.id,
    userId    : entry?.userId,
  });
}

// ─── Handle close button ──────────────────────────────────────────────────────
async function handleTicketClose(interaction, client, channelId) {
  const entry    = config.state.ticketLog[channelId];
  const isStaff  = config.ALLOWED_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
  const isOwner  = entry?.userId === interaction.user.id;

  if (!isStaff && !isOwner) {
    return interaction.reply({ content: "❌ Only the ticket owner or senior staff can close this ticket.", flags: 64 });
  }

  await interaction.deferReply();

  if (entry) entry.status = "closed";

  const closedAt = Math.floor(Date.now() / 1000);

  const closedEmbed = new EmbedBuilder()
    .setTitle("🔒 TICKET CLOSED")
    .setDescription(
      `This ticket has been closed by **${interaction.user.tag}**.\n\n` +
      (entry ? `**Original Issue:**\n>>> ${entry.reason}\n\n` : "") +
      `**Opened:** <t:${Math.floor((entry?.openedAt ?? Date.now()) / 1000)}:F>\n` +
      `**Closed:** <t:${closedAt}:F>\n` +
      (entry?.claimedBy ? `**Handled By:** <@${entry.claimedBy}>\n` : "") +
      "\n*This channel will be deleted in 10 seconds.*"
    )
    .setColor(0x4a0000)
    .setFooter({ text: "OSSI Support Desk  •  Ticket Closed" })
    .setTimestamp();

  await interaction.followUp({ embeds: [closedEmbed] });

  // Log closure before deleting
  await logTicketEvent(client, "close", {
    ticketNum  : entry?.ticketNum ?? "????",
    channelId,
    closedBy   : interaction.user.id,
    userId     : entry?.userId,
    username   : entry?.username,
    reason     : entry?.reason,
    openedAt   : entry?.openedAt ? Math.floor(entry.openedAt / 1000) : null,
    closedAt,
    claimedBy  : entry?.claimedBy,
  });

  delete config.state.ticketLog[channelId];

  const channel = interaction.guild.channels.cache.get(channelId);
  setTimeout(() => channel?.delete("Ticket closed").catch(() => {}), 10_000);
}

// ─── Log ticket events to the log channel ────────────────────────────────────
async function logTicketEvent(client, type, data) {
  const logCh = client.channels.cache.get(config.TICKET_LOG_CHANNEL_ID);
  if (!logCh) return;

  let embed;

  if (type === "open") {
    embed = new EmbedBuilder()
      .setTitle(`📂 TICKET OPENED — #${data.ticketNum}`)
      .setDescription(
        `A new support ticket has been opened.\n\n` +
        `**Submitted By:** <@${data.userId}> (${data.username})\n` +
        `**Channel:** <#${data.channelId}>\n` +
        `**Opened:** <t:${data.openedAt}:F>\n\n` +
        `**Issue / Request:**\n>>> ${data.reason}`
      )
      .setColor(0x0d3b2a)
      .setFooter({ text: `Ticket #${data.ticketNum}  •  Status: OPEN` })
      .setTimestamp();

  } else if (type === "claim") {
    embed = new EmbedBuilder()
      .setTitle(`✋ TICKET CLAIMED — #${data.ticketNum}`)
      .setDescription(
        `**Claimed By:** <@${data.claimedBy}>\n` +
        `**Ticket Owner:** <@${data.userId ?? "Unknown"}>\n` +
        `**Channel:** <#${data.channelId}>`
      )
      .setColor(0x3498db)
      .setFooter({ text: `Ticket #${data.ticketNum}  •  Status: CLAIMED` })
      .setTimestamp();

  } else if (type === "close") {
    embed = new EmbedBuilder()
      .setTitle(`🔒 TICKET CLOSED — #${data.ticketNum}`)
      .setDescription(
        `**Ticket Owner:** ${data.userId ? `<@${data.userId}>` : data.username ?? "Unknown"}\n` +
        `**Closed By:** <@${data.closedBy}>\n` +
        (data.claimedBy ? `**Handled By:** <@${data.claimedBy}>\n` : "") +
        `**Opened:** ${data.openedAt ? `<t:${data.openedAt}:F>` : "Unknown"}\n` +
        `**Closed:** <t:${data.closedAt}:F>\n\n` +
        (data.reason ? `**Original Issue:**\n>>> ${data.reason}` : "")
      )
      .setColor(0x4a0000)
      .setFooter({ text: `Ticket #${data.ticketNum}  •  Status: CLOSED` })
      .setTimestamp();
  }

  if (embed) await logCh.send({ embeds: [embed] }).catch(() => {});
}

// ─── Main interaction router (called from interactions/handler.js) ─────────────
async function handleInteraction(interaction, client) {

  // Button interactions
  if (interaction.isButton()) {
    const id = interaction.customId;

    if (id === "ossi_ticket_create") {
      return await handleTicketCreate(interaction, client);
    }
    if (id.startsWith("ossi_ticket_claim_")) {
      const channelId = id.replace("ossi_ticket_claim_", "");
      return await handleTicketClaim(interaction, client, channelId);
    }
    if (id.startsWith("ossi_ticket_close_")) {
      const channelId = id.replace("ossi_ticket_close_", "");
      return await handleTicketClose(interaction, client, channelId);
    }
    return false;
  }

  // Modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "ossi_ticket_modal") {
      return await handleTicketSubmit(interaction, client);
    }
    return false;
  }

  return false;
}

module.exports = { postTicketPanel, handleInteraction };
