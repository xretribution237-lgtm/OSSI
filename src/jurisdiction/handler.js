/**
 * jurisdiction/handler.js
 */

const { EmbedBuilder } = require("discord.js");
const config = require("../config");

// ─── /fileorder ───────────────────────────────────────────────────────────────
async function fileOrder(interaction, client) {
  const target  = interaction.options.getMember("who");
  const reason  = interaction.options.getString("reason");
  const ch      = client.channels.cache.get(config.MEETING_CHANNELS.JURISDICTION);
  if (!ch) return interaction.reply({ content: "❌ Jurisdiction channel not found.", flags: 64 });

  const pingStr = config.JURISDICTION_ROLE_IDS.map(id => `<@&${id}>`).join(" ");

  const embed = new EmbedBuilder()
    .setTitle("🏛️ ORDER FILED — JURISDICTION COURT")
    .setDescription(
      `${pingStr}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `A formal order has been filed with the **OSSI Jurisdiction Court**.\n\n` +
      `**Filed Against:** <@${target.id}>\n` +
      `**Filed By:** <@${interaction.user.id}>\n\n` +
      `**Statement of Claim:**\n> ${reason}\n\n` +
      "Senior staff and the presiding court officer have been notified. " +
      "A ruling will be issued at the discretion of authorised personnel.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x2a1a0a)
    .addFields(
      { name: "Filed",  value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: "Status", value: "⏳ Awaiting Review",                      inline: true },
    )
    .setFooter({ text: "OSSI – Jurisdiction Court  •  All orders are binding upon ruling" })
    .setTimestamp();

  await ch.send({ content: pingStr, embeds: [embed] });
  await interaction.reply({ content: `✅ Your order has been filed in <#${config.MEETING_CHANNELS.JURISDICTION}>.`, flags: 64 });
}

// ─── Auto-post SOO channel intro — ONLY if not already posted today ──────────
async function autoPostSOOChannel(client) {
  const ch = client.channels.cache.get(config.SOO_CHANNEL_ID);
  if (!ch) { console.error("❌ SOO channel not found."); return; }

  // Check last 10 messages — if the bot already posted the intro, skip it
  try {
    const recent = await ch.messages.fetch({ limit: 10 });
    const alreadyPosted = recent.some(m =>
      m.author?.id === client.user.id &&
      m.embeds?.[0]?.title?.includes("SIGNING CHANNEL")
    );
    if (alreadyPosted) {
      console.log("📋 SOO intro already present — skipping re-post.");
      return;
    }
  } catch {}

  const embed = new EmbedBuilder()
    .setTitle("📋 STATEMENT OF ORIGINALITY — SIGNING CHANNEL")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "**This channel is reserved for the signing of Statements of Originality (S.O.O).**\n\n" +
      "When a recruit completes their verification, their personal S.O.O embed will be " +
      "posted here automatically.\n\n" +
      "**To sign your S.O.O:**\n" +
      "> — Find your embed in this channel\n" +
      "> — **Send a message** (or reply to your embed) with your exact **Discord username**\n\n" +
      "Your username is case-insensitive. It is **not** your display name or nickname — " +
      "it is the username shown when you right-click your name.\n\n" +
      "⚠️ **Unsigned recruits are automatically removed after 72 hours.**\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x0d1b2a)
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  S.O.O System" })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log("📋 SOO channel intro embed posted.");
}

module.exports = { fileOrder, autoPostSOOChannel };
