module.exports = async function kick(interaction) {
  const member = interaction.options.getMember("member");
  const reason = interaction.options.getString("reason") ?? "No reason provided.";
  await member.kick(reason);
  await interaction.reply({ content: `👢 **${member.user.tag}** has been kicked. Reason: *${reason}*`, flags: 64 });
};
