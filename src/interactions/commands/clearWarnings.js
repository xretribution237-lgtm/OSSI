const { state } = require("../../config");

module.exports = async function clearWarnings(interaction) {
  const member = interaction.options.getMember("member");
  delete state.warnLog[member.id];
  await interaction.reply({ content: `✅ All warnings cleared for **${member.displayName}**.`, flags: 64 });
};
