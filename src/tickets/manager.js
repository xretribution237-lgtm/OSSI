/**
 * tickets/manager.js
 *
 * - postTicketPanel()    — posts the ticket panel embed with button on startup
 * - handleTicketButton() — opens modal when "Create Ticket" is clicked
 * - handleTicketModal()  — creates a private channel, posts ticket embed
 * - handleCloseButton()  — closes/archives the ticket channel
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

// ─── Post the ticket panel in the ticket channel (once on startup) ────────────
async function postTicketPanel(client) {
  const ch = client.channels.cache.get(config.TICKET_CHANNEL_ID);
  if (!ch) { console.error("❌ Ticket channel not found."); return; }

  // Check if panel already exists — avoid re-posting on every restart
  try {
    const recent = await ch.messages.fetch({ limit: 20 });
    const exists = recent.some(m =>
      m.author?.id === client.user.id &&
      m.components?.length > 0 &&
      m.embeds?.[0]?.title?.includes("SUPPORT")
    );
    if (exists) { console.log("🎫 Ticket panel already present — skipping."); return; }
  } catch {}

  const embed = new EmbedBuilder()
    .setTitle("🎫 OSSI SUPPORT & ASSISTANCE DESK")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "**Need assistance? You've come to the right place.**\n\n" +
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
      "> 1. Click **Create Ticket** below\n" +
      "> 2. A text box will appear — describe your issue\n" +
      "> 3. A private channel will be created for you and senior staff\n" +
      "> 4. A senior operative will respond as soon as possible\n\n" +
      "⚠️ *Abuse of the ticket system is a formal offense under OSSI conduct policy.*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x0d1b2a)
    .setFooter({ text: "OSSI – Support Desk  •  All tickets are logged and reviewed" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_create")
      .setLabel("📂  Create Ticket")
      .setStyle(ButtonStyle.Primary),
  );

  await ch.send({ embeds: [embed], components: [row] });
  console.log("🎫 Ticket panel posted.");
}

// ─── Button click → show modal ────────────────────────────────────────────────
async function handleTicketButton(interaction, client) {
  if (interaction.customId !== "ticket_create") return false;

  const modal = new ModalBuilder()
    .setCustomId("ticket_modal")
    .setTitle("OSSI Support Ticket");

  const reasonInput = new TextInputBuilder()
    .setCustomId("ticket_reason")
    .setLabel("Describe your issue or request in full")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      "Be as specific as possible. Include relevant operatives, dates, or channel names.\n\n" +
      "Vague or abusive submissions will be closed without response."
    )
    .setMinLength(20)
    .setMaxLength(1000)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  await interaction.showModal(modal);
  return true;
}

// ─── Modal submit → create private channel ────────────────────────────────────
async function handleTicketModal(interaction, client) {
  if (interaction.customId !== "ticket_modal") return false;

  await interaction.deferReply({ flags: 64 });

  const reason  = interaction.fields.getTextInputValue("ticket_reason");
  const guild   = interaction.guild;
  const user    = interaction.user;
  const member  = interaction.member;

  config.state.ticketCounter++;
  const ticketNum = String(config.state.ticketCounter).padStart(4, "0");
  const channelName = `🎫・ticket-${ticketNum}`;

  // Build permission overwrites
  const overwrites = [
    // Everyone denied
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    // Ticket creator
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    // Senior staff roles
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

  // Try to place ticket under same category as ticket channel
  const ticketChannel = guild.channels.cache.get(config.TICKET_CHANNEL_ID);
  const parentId = ticketChannel?.parentId ?? null;

  let ticketCh;
  try {
    ticketCh = await guild.channels.create({
      name   : channelName,
      type   : ChannelType.GuildText,
      parent : parentId,
      topic  : `Ticket #${ticketNum} — Opened by ${user.tag} | ${new Date().toUTCString()}`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    console.error("❌ Could not create ticket channel:", err.message);
    return interaction.followUp({ content: "❌ Failed to create ticket channel. Please contact a senior operative directly.", flags: 64 });
  }

  // Log it
  config.state.ticketLog[ticketCh.id] = {
    userId   : user.id,
    reason,
    openedAt : Date.now(),
    status   : "open",
    ticketNum,
  };

  const staffPing = config.ALLOWED_ROLE_IDS.map(id => `<@&${id}>`).join(" ");
  const openedAt  = Math.floor(Date.now() / 1000);

  const ticketEmbed = new EmbedBuilder()
    .setTitle(`🎫 TICKET #${ticketNum} — OPEN`)
    .setDescription(
      `${staffPing}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `A new support ticket has been opened and is awaiting review by senior staff.\n\n` +
      `**Submitted By:** <@${user.id}>\n` +
      `**Opened:** <t:${openedAt}:F>\n\n` +
      `**Issue / Request:**\n>>> ${reason}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "*A senior operative will respond shortly. Please remain patient and do not ping staff repeatedly.*"
    )
    .setColor(0x0d3b2a)
    .setThumbnail(member.displayAvatarURL({ size: 128 }))
    .setFooter({ text: `OSSI Support Desk  •  Ticket #${ticketNum}  •  Status: OPEN` })
    .setTimestamp();

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close_${ticketCh.id}`)
      .setLabel("🔒  Close Ticket")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ticket_claim_${ticketCh.id}`)
      .setLabel("✋  Claim Ticket")
      .setStyle(ButtonStyle.Secondary),
  );

  await ticketCh.send({ embeds: [ticketEmbed], components: [closeRow] });
  await ticketCh.send({ content: `<@${user.id}> — Welcome. Please provide any additional details below and a senior operative will be with you shortly.` });

  await interaction.followUp({
    content: `✅ Your ticket has been created: ${ticketCh}`,
    flags: 64,
  });

  return true;
}

// ─── Close button ─────────────────────────────────────────────────────────────
async function handleCloseButton(interaction, client) {
  if (!interaction.customId.startsWith("ticket_close_") &&
      !interaction.customId.startsWith("ticket_claim_")) return false;

  const channelId = interaction.customId.split("_").pop();
  const entry     = config.state.ticketLog[channelId];

  // Claim button
  if (interaction.customId.startsWith("ticket_claim_")) {
    if (!config.ALLOWED_ROLE_IDS.some(id => interaction.member.roles.cache.has(id))) {
      await interaction.reply({ content: "❌ Only senior staff can claim tickets.", flags: 64 });
      return true;
    }
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setDescription(`✋ **${interaction.user.tag}** has claimed this ticket and will be handling your request.`)
        .setColor(0x0d3b2a)],
    });
    if (entry) entry.claimedBy = interaction.user.id;
    return true;
  }

  // Close button — only staff or the ticket owner
  const isStaff = config.ALLOWED_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
  const isOwner = entry?.userId === interaction.user.id;

  if (!isStaff && !isOwner) {
    await interaction.reply({ content: "❌ Only the ticket owner or senior staff can close this ticket.", flags: 64 });
    return true;
  }

  await interaction.deferReply();

  const guild   = interaction.guild;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return true;

  if (entry) entry.status = "closed";

  const closedEmbed = new EmbedBuilder()
    .setTitle(`🔒 TICKET CLOSED`)
    .setDescription(
      `This ticket has been closed by **${interaction.user.tag}**.\n\n` +
      (entry ? `**Original Issue:**\n>>> ${entry.reason}\n\n` : "") +
      `**Opened:** ${entry ? `<t:${Math.floor(entry.openedAt / 1000)}:F>` : "Unknown"}\n` +
      `**Closed:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
      "*This channel will be deleted in 10 seconds.*"
    )
    .setColor(0x4a0000)
    .setFooter({ text: "OSSI Support Desk  •  Ticket Closed" })
    .setTimestamp();

  await interaction.followUp({ embeds: [closedEmbed] });
  setTimeout(() => channel.delete("Ticket closed").catch(() => {}), 10_000);

  return true;
}

module.exports = { postTicketPanel, handleTicketButton, handleTicketModal, handleCloseButton };
