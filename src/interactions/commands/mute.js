module.exports = async function mute(interaction) {
  const member  = interaction.options.getMember("member");
  const minutes = interaction.options.getInteger("minutes");
  const until   = new Date(Date.now() + minutes * 60 * 1000);
  await member.timeout(until - Date.now(), `Muted by ${interaction.user.tag}`);
  await interaction.reply({ content: `🔇 **${member.user.tag}** has been muted for ${minutes} minute(s).`, flags: 64 });
};
