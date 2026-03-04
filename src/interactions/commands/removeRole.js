module.exports = async function removeRole(interaction) {
  const member = interaction.options.getMember("member");
  const role   = interaction.options.getRole("role");
  await member.roles.remove(role);
  await interaction.reply({ content: `✅ Removed **${role.name}** from **${member.displayName}**.`, flags: 64 });
};
