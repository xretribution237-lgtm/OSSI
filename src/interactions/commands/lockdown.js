const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../../config");

module.exports = async function lockdown(interaction) {
  const lift  = interaction.options.getString("action") === "lift";
  const guild = interaction.guild;

  await interaction.deferReply({ flags: 64 });

  const textChannels = guild.channels.cache.filter(c => c.type === 0);
  let count = 0;

  for (const [, ch] of textChannels) {
    try {
      await ch.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: lift ? null : false,
      });
      count++;
    } catch {}
  }

  const embed = new EmbedBuilder()
    .setTitle(lift ? "🔓 SERVER LOCKDOWN LIFTED" : "🔒 SERVER LOCKDOWN INITIATED")
    .setDescription(
      lift
        ? `The server lockdown has been lifted by **${interaction.user.tag}**.\n\nNormal messaging permissions have been restored across all channels.`
        : `**${interaction.user.tag}** has initiated a full server lockdown.\n\nAll channels have been locked. No members may send messages until the lockdown is lifted.\n\n*Use \`/lockdown action:lift\` to restore access.*`
    )
    .setColor(lift ? 0x00b894 : 0xe74c3c)
    .addFields({ name: "Channels Affected", value: `${count}`, inline: true })
    .setFooter({ text: "OSSI – Security Command" })
    .setTimestamp();

  const annCh = interaction.client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (annCh) await annCh.send({ embeds: [embed] });
  await interaction.followUp({ embeds: [embed], flags: 64 });
};
