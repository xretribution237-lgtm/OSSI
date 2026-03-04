const { EmbedBuilder } = require("discord.js");
const { WELCOME_CHANNEL_ID } = require("../config");

// Ordinal suffix helper: 1 → 1st, 2 → 2nd, 3 → 3rd, etc.
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = async function handleMemberAdd(member, client) {
  const channel = client.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  // Fetch fresh guild member count
  await member.guild.members.fetch();
  const memberCount = member.guild.memberCount;

  const embed = new EmbedBuilder()
    .setTitle("— NEW OPERATIVE DETECTED —")
    .setDescription(
      `**${member.user.username}** has entered the facility.\n\n` +
      `You are the **${ordinal(memberCount)} member** of this organisation. ` +
      `Your presence has been logged and your file is now open.\n\n` +
      `Head to the verification channel to begin your clearance process.`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256, dynamic: true }))
    .setColor(0x0d1b2a)
    .addFields(
      { name: "Operative",     value: `<@${member.id}>`,                                        inline: true },
      { name: "Member Count",  value: `\`${memberCount.toLocaleString()}\` members`,            inline: true },
      { name: "Account Age",   value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  Access Restricted" })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  console.log(`👋 Member joined: ${member.user.tag} — total: ${memberCount}`);
};
