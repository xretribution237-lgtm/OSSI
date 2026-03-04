module.exports = async function purge(interaction) {
  const amount = interaction.options.getInteger("amount");
  await interaction.deferReply({ flags: 64 });
  const deleted = await interaction.channel.bulkDelete(amount, true);
  await interaction.followUp({ content: `🗑️ Deleted ${deleted.size} messages.`, flags: 64 });
};
