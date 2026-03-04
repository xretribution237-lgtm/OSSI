module.exports = async function unban(interaction) {
  const userId = interaction.options.getString("user_id");
  try {
    const user = await interaction.client.users.fetch(userId);
    await interaction.guild.members.unban(user);
    await interaction.reply({ content: `✅ **${user.tag}** has been unbanned.`, flags: 64 });
  } catch (e) {
    await interaction.reply({ content: `❌ Failed to unban: ${e.message}`, flags: 64 });
  }
};
