const { EmbedBuilder, time } = require("discord.js");
const config = require("../../config");

module.exports = async function audit(interaction) {
  await interaction.deferReply({ flags: 64 });
  const member = interaction.options.getMember("who");
  const userId = member.id;

  const warnings    = config.state.warnLog[userId]    ?? [];
  const strikes     = config.state.strikeLog[userId]  ?? { count: 0, offenses: [] };
  const commends    = config.state.commendLog[userId]  ?? [];
  const soo         = config.state.sooLog[userId];
  const absent      = config.state.absentLog[userId];
  const watchlisted = !!config.state.watchlist[userId];

  // Check if currently jailed
  const jailEntry = [
    ...config.state.jailCells,
    ...config.state.holdingCells,
  ].find(c => c?.userId === userId);

  const embed = new EmbedBuilder()
    .setTitle(`🗂️ OPERATIVE FILE — ${member.user.tag}`)
    .setDescription(
      `Full service record for <@${userId}>.\n` +
      `*Generated: <t:${Math.floor(Date.now()/1000)}:F>*\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setThumbnail(member.displayAvatarURL({ size: 128 }))
    .setColor(0x0d1b2a)
    .addFields(
      { name: "Account Created",  value: time(member.user.createdAt, "D"), inline: true },
      { name: "Joined Server",    value: time(member.joinedAt, "D"),       inline: true },
      { name: "SOO Status",       value: soo ? (soo.signed ? "✅ Signed" : "⏳ Pending") : "No record", inline: true },
      { name: "Warnings",         value: `${warnings.length}`, inline: true },
      { name: "Active Strikes",   value: `${strikes.count}/${config.MAX_STRIKES}`, inline: true },
      { name: "Commendations",    value: `${commends.length}`, inline: true },
      { name: "Detention",        value: jailEntry ? `⛓️ ${jailEntry.isHolding ? "Holding" : "Cell"}` : "None", inline: true },
      { name: "On Watchlist",     value: watchlisted ? "🔴 Yes" : "No",    inline: true },
      { name: "Absent",           value: absent ? `Until ${absent.returnDate}` : "No", inline: true },
      { name: "Current Roles",    value: member.roles.cache.filter(r => r.name !== "@everyone").map(r => r.name).join(", ") || "None", inline: false },
    )
    .setFooter({ text: "OSSI – Internal Affairs  •  Classified Record" })
    .setTimestamp();

  if (warnings.length) {
    embed.addFields({ name: "⚠️ Warning Log", value: warnings.slice(-5).map((w, i) => `${i+1}. ${w}`).join("\n"), inline: false });
  }
  if (commends.length) {
    embed.addFields({ name: "🏅 Commendation Log", value: commends.slice(-3).map((c, i) => `${i+1}. ${c.reason}`).join("\n"), inline: false });
  }

  await interaction.followUp({ embeds: [embed] });
};
