const { EmbedBuilder, time } = require("discord.js");

module.exports = async function userinfo(interaction) {
  const member = interaction.options.getMember("member") ?? interaction.member;
  const roles  = member.roles.cache.filter(r => r.name !== "@everyone").map(r => r.toString());

  const embed = new EmbedBuilder()
    .setTitle(`User Info – ${member.user.tag}`)
    .setThumbnail(member.displayAvatarURL({ size: 256 }))
    .setColor(member.displayColor || 0x1a1a2e)
    .addFields(
      { name: "ID",             value: member.id,                                          inline: true },
      { name: "Nickname",       value: member.nickname ?? "None",                          inline: true },
      { name: "Bot?",           value: member.user.bot ? "Yes" : "No",                     inline: true },
      { name: "Account Created",value: time(member.user.createdAt, "D"),                   inline: true },
      { name: "Joined Server",  value: time(member.joinedAt, "D"),                         inline: true },
      { name: `Roles (${roles.length})`, value: roles.join(" ") || "None",                inline: false },
    )
    .setFooter({ text: "OSSI – Member File" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
};
