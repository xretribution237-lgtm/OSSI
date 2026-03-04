module.exports = async function slowmode(interaction) {
  const seconds = interaction.options.getInteger("seconds");
  await interaction.channel.setRateLimitPerUser(seconds);
  const msg = seconds > 0 ? `⏱️ Slowmode set to **${seconds}s**.` : "⏱️ Slowmode disabled.";
  await interaction.reply({ content: msg, flags: 64 });
};
