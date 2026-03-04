module.exports = async function unlock(interaction) {
  await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
  await interaction.reply({ content: "🔓 Channel unlocked.", flags: 64 });
};
