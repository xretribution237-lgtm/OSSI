module.exports = async function giveRole(interaction) {
  const member = interaction.options.getMember("member");
  const role   = interaction.options.getRole("role");
  await member.roles.add(role);
  await interaction.reply({ content: `✅ Gave **${role.name}** to **${member.displayName}**.`, flags: 64 });
};
