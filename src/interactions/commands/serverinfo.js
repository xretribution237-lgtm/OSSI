const { EmbedBuilder, time } = require("discord.js");

module.exports = async function serverinfo(interaction) {
  const g = interaction.guild;
  await g.fetch();

  const embed = new EmbedBuilder()
    .setTitle(`Server Info – ${g.name}`)
    .setThumbnail(g.iconURL({ size: 256 }) ?? null)
    .setColor(0x1a1a2e)
    .addFields(
      { name: "Owner",               value: `<@${g.ownerId}>`,                                  inline: true  },
      { name: "Members",             value: g.memberCount.toString(),                            inline: true  },
      { name: "Channels",            value: g.channels.cache.size.toString(),                    inline: true  },
      { name: "Roles",               value: g.roles.cache.size.toString(),                       inline: true  },
      { name: "Emojis",              value: g.emojis.cache.size.toString(),                      inline: true  },
      { name: "Boosts",              value: g.premiumSubscriptionCount?.toString() ?? "0",       inline: true  },
      { name: "Verification Level",  value: g.verificationLevel.toString(),                      inline: true  },
      { name: "Created",             value: time(g.createdAt, "D"),                              inline: true  },
    )
    .setFooter({ text: `ID: ${g.id}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
};
