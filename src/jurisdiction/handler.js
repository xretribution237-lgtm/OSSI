/**
 * jurisdiction/handler.js
 *
 * - fileOrder()   : /fileorder <who> <reason> — alerts senior staff + judge
 * - autoPostSOO() : posts the SOO channel intro embed on bot startup
 */

const { EmbedBuilder } = require("discord.js");
const config = require("../config");

// ─── /fileorder ───────────────────────────────────────────────────────────────

async function fileOrder(interaction, client) {
  const target = interaction.options.getMember("who");
  const reason = interaction.options.getString("reason");

  const ch = client.channels.cache.get(config.MEETING_CHANNELS.JURISDICTION);
  if (!ch) return interaction.reply({ content: "❌ Jurisdiction channel not found.", flags: 64 });

  const pingStr = config.JURISDICTION_ROLE_IDS.map(id => `<@&${id}>`).join(" ");
  const filerMention = `<@${interaction.user.id}>`;
  const targetMention = `<@${target.id}>`;

  const embed = new EmbedBuilder()
    .setTitle("🏛️ ORDER FILED — JURISDICTION COURT")
    .setDescription(
      `${pingStr}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `A formal order has been filed with the **OSSI Jurisdiction Court**.\n\n` +
      `**Filed Against:** ${targetMention}\n` +
      `**Filed By:** ${filerMention}\n\n` +
      `**Statement of Claim:**\n> ${reason}\n\n` +
      "Senior staff and the presiding court officer have been notified. " +
      "A ruling will be issued at the discretion of authorised personnel.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x2a1a0a)
    .addFields(
      { name: "Case Filed",  value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: "Status",      value: "⏳ Awaiting Review",                      inline: true },
    )
    .setFooter({ text: "OSSI – Jurisdiction Court  •  All orders are binding upon ruling" })
    .setTimestamp();

  await ch.send({ content: pingStr, embeds: [embed] });
  await interaction.reply({ content: `✅ Your order has been filed in <#${config.MEETING_CHANNELS.JURISDICTION}>.`, flags: 64 });
}

// ─── Auto-post SOO channel intro embed on bot startup ────────────────────────

async function autoPostSOOChannel(client) {
  const ch = client.channels.cache.get(config.SOO_CHANNEL_ID);
  if (!ch) {
    console.error("❌ SOO channel not found for auto-post.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("📋 STATEMENT OF ORIGINALITY — SIGNING CHANNEL")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "**This channel is reserved for the signing of Statements of Originality (S.O.O).**\n\n" +
      "When a recruit completes their verification, their personal S.O.O embed will be " +
      "posted here automatically by the system.\n\n" +
      "**To sign your S.O.O:**\n" +
      "> — Locate your embed below\n" +
      "> — **Reply directly** to it\n" +
      "> — Type your exact **Discord username** in the reply\n\n" +
      "Signatures are case-insensitive but must otherwise match your username exactly.\n\n" +
      "⚠️ **Unsigned recruits are automatically removed after 72 hours.**\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x0d1b2a)
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  S.O.O System" })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log("📋 SOO channel intro embed posted on startup.");
}

module.exports = { fileOrder, autoPostSOOChannel };
