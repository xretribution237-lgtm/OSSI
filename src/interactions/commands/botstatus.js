const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function botstatus(interaction) {
  const uptimeMs   = process.uptime() * 1000;
  const d = Math.floor(uptimeMs / 86400000);
  const h = Math.floor((uptimeMs % 86400000) / 3600000);
  const m = Math.floor((uptimeMs % 3600000) / 60000);
  const uptimeStr  = `${d}d ${h}h ${m}m`;

  const pendingSOO  = Object.values(config.state.sooLog).filter(e => !e.signed).length;
  const cellsFilled = config.state.jailCells.filter(Boolean).length;
  const holdingFilled = config.state.holdingCells.filter(Boolean).length;
  const openTickets = Object.values(config.state.ticketLog).filter(t => t.status === "open").length;
  const watchlisted = Object.keys(config.state.watchlist).length;
  const absentees   = Object.keys(config.state.absentLog).length;

  const embed = new EmbedBuilder()
    .setTitle("🖥️ OSSI BOT STATUS — SYSTEM REPORT")
    .setDescription(`*Generated: <t:${Math.floor(Date.now()/1000)}:F>*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    .setColor(0x0d1b2a)
    .addFields(
      { name: "⏱️ Uptime",              value: uptimeStr,              inline: true },
      { name: "📋 Pending SOOs",         value: `${pendingSOO}`,        inline: true },
      { name: "⛓️ Jail Cells Occupied",  value: `${cellsFilled}/3`,     inline: true },
      { name: "🔒 Holding Cells",        value: `${holdingFilled}/2`,   inline: true },
      { name: "🎫 Open Tickets",         value: `${openTickets}`,       inline: true },
      { name: "👁️ Watchlisted",          value: `${watchlisted}`,       inline: true },
      { name: "📅 Logged Absences",      value: `${absentees}`,         inline: true },
      { name: "🏅 Commendation Records", value: `${Object.keys(config.state.commendLog).length}`, inline: true },
    )
    .setFooter({ text: "OSSI Bot  •  All systems nominal" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: 64 });
};
