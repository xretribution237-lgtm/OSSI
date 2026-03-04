const { EmbedBuilder } = require("discord.js");
const { VERIFICATION_CHANNEL_ID, FORM_LINK, state } = require("../../config");

module.exports = async function postVerification(interaction, client) {
  const channel = client.channels.cache.get(VERIFICATION_CHANNEL_ID);
  if (!channel) {
    return interaction.reply({ content: "❌ Verification channel not found. Check `VERIFICATION_CHANNEL_ID` in config.", flags: 64 });
  }

  const embed = new EmbedBuilder()
    .setTitle("__OFFICE OF STRATEGIC SECRET INTELLIGENCE (OSSI)__")
    .setDescription(
      "**RECRUITMENT & VETTING QUESTIONNAIRE – FORM OSSI-RVQ-001**\n" +
      "**CLASSIFICATION: TOP SECRET // NOFORN // ORCON**\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "To gain entry into this organisation you **must** complete the form linked below in full.\n\n" +
      `📋 **[ACCESS FORM OSSI-RVQ-001](${FORM_LINK})**\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "**Instructions:**\n" +
      "> **1.** Open and read the form carefully.\n" +
      "> **2.** Complete **every** field honestly and in full.\n" +
      "> **3.** Once submitted, return to this channel and react with the correct emoji to confirm completion.\n\n" +
      "⚠️ *Incomplete or falsified submissions will result in immediate disqualification and removal.*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x1a1a2e)
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence | Clearance required to proceed." })
    .setTimestamp();

  const msg = await channel.send({ embeds: [embed] });
  state.verificationMessageId = msg.id;

  await interaction.reply({ content: `✅ Verification embed posted in <#${VERIFICATION_CHANNEL_ID}>.`, flags: 64 });
};
