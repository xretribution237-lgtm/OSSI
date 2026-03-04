module.exports = async function lock(interaction) {
  await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
  await interaction.reply({ content: "🔒 Channel locked.", flags: 64 });
};
