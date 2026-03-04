module.exports = async function ban(interaction) {
  const member      = interaction.options.getMember("member");
  const reason      = interaction.options.getString("reason") ?? "No reason provided.";
  const deleteDays  = interaction.options.getInteger("delete_days") ?? 0;
  await interaction.guild.members.ban(member, { reason, deleteMessageDays: deleteDays });
  await interaction.reply({ content: `🔨 **${member.user.tag}** has been banned. Reason: *${reason}*`, flags: 64 });
};
