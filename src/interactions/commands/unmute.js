module.exports = async function unmute(interaction) {
  const member = interaction.options.getMember("member");
  await member.timeout(null);
  await interaction.reply({ content: `🔊 **${member.user.tag}**'s timeout has been removed.`, flags: 64 });
};
