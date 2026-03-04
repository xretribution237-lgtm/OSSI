/**
 * soo/manager.js
 *
 * Handles the full Statement of Originality (SOO) lifecycle:
 *  1. postSOO()       — called right after verification; posts the SOO embed and
 *                       stores the recruit in sooLog.
 *  2. handleMessage() — listens for replies in the SOO channel; validates the
 *                       username match and marks them as signed.
 *  3. startScheduler()— hourly loop that re-pings unsigned recruits and kicks
 *                       anyone who has gone 3 days unsigned.
 */

const { EmbedBuilder } = require("discord.js");
const {
  SOO_CHANNEL_ID,
  RECRUIT_ROLE_ID,
  SOO_REMINDER_INTERVAL_MS,
  SOO_EXPIRY_MS,
  state,
} = require("../config");

// ─────────────────────────────────────────────────────────────────────────────
//  1.  POST SOO EMBED  (called from reactions/handler.js after verification)
// ─────────────────────────────────────────────────────────────────────────────
async function postSOO(member, client) {
  const channel = client.channels.cache.get(SOO_CHANNEL_ID);
  if (!channel) {
    console.error("❌ SOO channel not found. Check SOO_CHANNEL_ID in config.");
    return;
  }

  const expiryTimestamp = Math.floor((Date.now() + SOO_EXPIRY_MS) / 1000);

  const embed = new EmbedBuilder()
    .setTitle("— STATEMENT OF ORIGINALITY (S.O.O) —")
    .setDescription(
      `<@${member.id}> — your identity verification is pending final confirmation.\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "To complete your onboarding and unlock full server access, you must sign " +
      "your **Statement of Originality**.\n\n" +
      "**How to sign:**\n" +
      "> Reply to this message with your exact **Discord username** to confirm your identity.\n\n" +
      "⚠️ **Failure to sign within 72 hours will result in automatic removal from the server.**\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x1a0a0a)
    .addFields(
      { name: "Operative",    value: `<@${member.id}>`,          inline: true },
      { name: "Status",       value: "⏳ Awaiting Signature",    inline: true },
      { name: "Deadline",     value: `<t:${expiryTimestamp}:R>`, inline: true },
    )
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  S.O.O Required" })
    .setTimestamp();

  const msg = await channel.send({ embeds: [embed] });

  // Store in memory
  state.sooLog[member.id] = {
    messageId  : msg.id,
    username   : member.user.username, // store the real username for comparison
    verifiedAt : Date.now(),
    signed     : false,
  };

  console.log(`📋 SOO posted for ${member.user.tag} — message ID ${msg.id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  2.  HANDLE MESSAGE REPLY  (called from index.js messageCreate event)
// ─────────────────────────────────────────────────────────────────────────────
async function handleMessage(message, client) {
  // Must be in the SOO channel
  if (message.channelId !== SOO_CHANNEL_ID) return;

  // Ignore bots
  if (message.author.bot) return;

  const userId = message.author.id;
  const entry  = state.sooLog[userId];

  // Not a pending recruit — ignore
  if (!entry || entry.signed) return;

  // Must be a reply to their specific SOO embed message
  if (!message.reference || message.reference.messageId !== entry.messageId) {
    // They messaged in the channel but didn't reply to the correct message
    const warning = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            "⚠️ To sign your Statement of Originality, you must **reply directly** to your SOO embed above."
          )
          .setColor(0x8b0000),
      ],
    });
    // Auto-delete the warning after 8 seconds
    setTimeout(() => warning.delete().catch(() => {}), 8000);
    return;
  }

  // ── Username comparison (case-insensitive) ──────────────────────────────
  const submitted = message.content.trim().toLowerCase();
  const expected  = entry.username.toLowerCase();

  if (submitted !== expected) {
    const failEmbed = new EmbedBuilder()
      .setTitle("✗ Signature Mismatch")
      .setDescription(
        "The username you submitted does not match your Discord account.\n\n" +
        "Please check your exact username and try again by replying to your SOO embed.\n\n" +
        "*Note: Your username is case-insensitive but must otherwise be exact.*"
      )
      .setColor(0x8b0000)
      .setFooter({ text: "OSSI – Statement of Originality" })
      .setTimestamp();

    const failMsg = await message.reply({ embeds: [failEmbed] });
    setTimeout(() => failMsg.delete().catch(() => {}), 12000);
    return;
  }

  // ── SUCCESS — mark as signed ─────────────────────────────────────────────
  entry.signed = true;

  // Edit the original SOO embed to show signed status
  try {
    const sooChannel = client.channels.cache.get(SOO_CHANNEL_ID);
    const origMsg    = await sooChannel.messages.fetch(entry.messageId);
    const signedAt   = Math.floor(Date.now() / 1000);

    const signedEmbed = new EmbedBuilder()
      .setTitle("— STATEMENT OF ORIGINALITY (S.O.O) —")
      .setDescription(
        `<@${userId}> — identity confirmed. Statement signed.\n\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "This operative has signed their Statement of Originality and their " +
        "identity has been verified on record. Full server access is now granted.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      )
      .setColor(0x00b894)
      .addFields(
        { name: "Operative",  value: `<@${userId}>`,          inline: true },
        { name: "Status",     value: "✅ Signed & Confirmed", inline: true },
        { name: "Signed",     value: `<t:${signedAt}:F>`,     inline: true },
      )
      .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  S.O.O On File" })
      .setTimestamp();

    await origMsg.edit({ embeds: [signedEmbed] });
  } catch (err) {
    console.warn("⚠️  Could not edit SOO embed after signing:", err.message);
  }

  // Success reply in channel
  const successEmbed = new EmbedBuilder()
    .setTitle("✅ Statement of Originality Signed")
    .setDescription(
      `**${message.author.username}** — your signature has been recorded.\n\n` +
      "Your identity is confirmed. You now have full access to the server.\n\n" +
      "*Welcome to OSSI.*"
    )
    .setColor(0x00b894)
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence" })
    .setTimestamp();

  await message.reply({ embeds: [successEmbed] });

  console.log(`✅ SOO signed: ${message.author.tag} (${userId})`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  3.  SCHEDULER  (hourly reminders + 3-day expiry + kick)
// ─────────────────────────────────────────────────────────────────────────────
function startScheduler(client) {
  setInterval(async () => {
    const now = Date.now();

    for (const [userId, entry] of Object.entries(state.sooLog)) {
      if (entry.signed) continue; // already done — skip

      const guild = client.guilds.cache.first(); // assumes single-server bot
      if (!guild) continue;

      let member;
      try {
        member = await guild.members.fetch(userId);
      } catch {
        // Member already left — clean up
        delete state.sooLog[userId];
        continue;
      }

      const elapsed = now - entry.verifiedAt;

      // ── 3-day expiry: kick and remove recruit role ───────────────────────
      if (elapsed >= SOO_EXPIRY_MS) {
        try {
          // Update the SOO embed to show expired
          const sooChannel = client.channels.cache.get(SOO_CHANNEL_ID);
          if (sooChannel) {
            const origMsg = await sooChannel.messages.fetch(entry.messageId).catch(() => null);
            if (origMsg) {
              const expiredEmbed = new EmbedBuilder()
                .setTitle("— STATEMENT OF ORIGINALITY (S.O.O) —")
                .setDescription(
                  `<@${userId}> — **DEADLINE EXCEEDED. ACCESS REVOKED.**\n\n` +
                  "This operative failed to sign their Statement of Originality within the required 72-hour window. " +
                  "They have been removed from the facility.\n\n"
                )
                .setColor(0x4a0000)
                .addFields(
                  { name: "Operative", value: `${entry.username}`, inline: true },
                  { name: "Status",    value: "❌ Expired — Removed", inline: true },
                )
                .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  Access Revoked" })
                .setTimestamp();
              await origMsg.edit({ embeds: [expiredEmbed] });
            }
          }

          // DM them before kick
          try {
            const dmEmbed = new EmbedBuilder()
              .setTitle("⛔ OSSI Access Revoked")
              .setDescription(
                "You have been removed from the **OSSI** server.\n\n" +
                "You failed to sign your Statement of Originality within the required 72-hour window. " +
                "Your clearance has been revoked and your file has been sealed."
              )
              .setColor(0x4a0000)
              .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence" })
              .setTimestamp();
            await member.send({ embeds: [dmEmbed] });
          } catch { /* DMs closed */ }

          // Remove recruit role then kick
          const recruitRole = guild.roles.cache.get(RECRUIT_ROLE_ID);
          if (recruitRole && member.roles.cache.has(RECRUIT_ROLE_ID)) {
            await member.roles.remove(recruitRole, "SOO not signed within 72 hours.");
          }
          await member.kick("Failed to sign Statement of Originality within 72 hours.");

          console.log(`⛔ Kicked (SOO expired): ${entry.username} (${userId})`);
        } catch (err) {
          console.error(`❌ Could not kick ${userId}:`, err.message);
        }

        delete state.sooLog[userId];
        continue;
      }

      // ── Hourly reminder ping ─────────────────────────────────────────────
      const sooChannel = client.channels.cache.get(SOO_CHANNEL_ID);
      if (!sooChannel) continue;

      const hoursLeft = Math.floor((SOO_EXPIRY_MS - elapsed) / 3_600_000);
      const timeLabel = hoursLeft >= 24
        ? `${Math.floor(hoursLeft / 24)} day${Math.floor(hoursLeft / 24) === 1 ? "" : "s"}`
        : `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}`;

      const reminderEmbed = new EmbedBuilder()
        .setDescription(
          `<@${userId}> — ⚠️ **Your Statement of Originality is still unsigned.**\n\n` +
          `You have approximately **${timeLabel}** remaining to sign before you are automatically removed.\n\n` +
          `Reply to your SOO embed above with your Discord username to sign.`
        )
        .setColor(0x8b4500)
        .setFooter({ text: "OSSI – S.O.O Reminder" })
        .setTimestamp();

      try {
        await sooChannel.send({ embeds: [reminderEmbed] });
        console.log(`🔔 SOO reminder sent: ${entry.username} (${userId}) — ${timeLabel} left`);
      } catch (err) {
        console.warn(`⚠️  Could not send SOO reminder for ${userId}:`, err.message);
      }
    }
  }, SOO_REMINDER_INTERVAL_MS);

  console.log("⏱️  SOO scheduler started (1-hour interval).");
}

module.exports = { postSOO, handleMessage, startScheduler };
