const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function roster(interaction) {
  await interaction.deferReply();
  const guild = interaction.guild;
  await guild.members.fetch();

  // Build role → members map for all board roles
  const roleOrder = [
    ...config.ALLOWED_ROLE_IDS,
    ...config.BOARD_ROLE_IDS.filter(id => !config.ALLOWED_ROLE_IDS.includes(id)),
  ];

  const fields = [];
  const counted = new Set();

  for (const roleId of roleOrder) {
    const role    = guild.roles.cache.get(roleId);
    if (!role) continue;
    const members = role.members.filter(m => !m.user.bot).map(m => `<@${m.id}>`);
    if (!members.size && !members.length) continue;
    const list = [...members].join(", ") || "—";
    fields.push({ name: `${role.name}`, value: list, inline: false });
    [...role.members.keys()].forEach(id => counted.add(id));
  }

  const totalMembers = guild.memberCount;
  const embed = new EmbedBuilder()
    .setTitle("📋 OSSI OPERATIVE ROSTER")
    .setDescription(
      `**Total Server Members:** ${totalMembers}\n` +
      `**Listed Operatives:** ${counted.size}\n\n` +
      `*Generated: <t:${Math.floor(Date.now()/1000)}:F>*\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields(fields.length ? fields : [{ name: "No operatives found", value: "—" }])
    .setColor(0x0d1b2a)
    .setFooter({ text: "OSSI – Internal Affairs  •  Roster is classified" })
    .setTimestamp();

  await interaction.followUp({ embeds: [embed] });
};
