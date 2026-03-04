const { EmbedBuilder } = require("discord.js");
const { LEAVE_CHANNEL_ID } = require("../config");

module.exports = async function handleMemberRemove(member, client) {
  const channel = client.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!channel) return;

  // Fetch fresh guild member count
  await member.guild.members.fetch().catch(() => {});
  const memberCount = member.guild.memberCount;

  // How long they were in the server
  const joinedAt   = member.joinedAt;
  const durationMs = joinedAt ? Date.now() - joinedAt.getTime() : null;
  const days        = durationMs ? Math.floor(durationMs / 86_400_000) : null;
  const durationStr = days === null
    ? "Unknown"
    : days === 0
    ? "Less than a day"
    : `${days} day${days === 1 ? "" : "s"}`;

  // Collect role names (excluding @everyone)
  const roles = member.roles?.cache
    ?.filter(r => r.name !== "@everyone")
    ?.map(r => r.name)
    ?.join(", ") || "None";

  const embed = new EmbedBuilder()
    .setTitle("— OPERATIVE DEPARTURE LOGGED —")
    .setDescription(
      `**${member.user.username}** has left the facility.\n\n` +
      `Their file has been sealed and access credentials have been revoked. ` +
      `We are now **${memberCount.toLocaleString()} members** strong.`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256, dynamic: true }))
    .setColor(0x2c1a1a)
    .addFields(
      { name: "Operative",        value: `${member.user.tag}`,            inline: true },
      { name: "Time in Service",  value: durationStr,                     inline: true },
      { name: "Member Count",     value: `\`${memberCount.toLocaleString()}\` remaining`, inline: true },
      { name: "Last Known Ranks", value: roles,                           inline: false },
    )
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  File Sealed" })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  console.log(`🚪 Member left: ${member.user.tag} — total: ${memberCount}`);
};
