/**
 * jail/setup.js
 *
 * Creates the detention facility category + channels ONCE.
 * On every startup it scans the guild for the existing category by name
 * so it never duplicates — even across bot restarts.
 */

const { ChannelType, PermissionFlagsBits } = require("discord.js");
const config = require("../config");

async function setupJailChannels(guild) {
  const { state, JAIL_ROLE_ID } = config;

  // ── Check if the category already exists in the guild ─────────────────────
  const existingCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory &&
         c.name === "⛓️ DETENTION FACILITY"
  );

  if (existingCategory) {
    // Recover channel IDs from the existing category
    const children = guild.channels.cache.filter(
      c => c.parentId === existingCategory.id && c.type === ChannelType.GuildText
    );

    state.detentionCategoryId = existingCategory.id;
    state.cellChannelIds    = [];
    state.holdingChannelIds = [];

    for (const [, ch] of children) {
      if (ch.name.includes("cell"))    state.cellChannelIds.push(ch.id);
      if (ch.name.includes("holding")) state.holdingChannelIds.push(ch.id);
    }

    // Sort them so cell-one is index 0, cell-two is 1, etc.
    state.cellChannelIds.sort();
    state.holdingChannelIds.sort();

    // Make sure jail cell arrays match
    while (state.jailCells.length < config.JAIL_CELL_COUNT)       state.jailCells.push(null);
    while (state.holdingCells.length < config.HOLDING_CELL_COUNT) state.holdingCells.push(null);

    console.log(
      `✅ Detention facility found — ` +
      `${state.cellChannelIds.length} cells, ` +
      `${state.holdingChannelIds.length} holding cells recovered.`
    );
    return;
  }

  // ── Category doesn't exist — create it fresh ──────────────────────────────
  console.log("🏗️  Creating detention facility channels...");

  const category = await guild.channels.create({
    name: "⛓️ DETENTION FACILITY",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    ],
  });
  state.detentionCategoryId = category.id;
  console.log(`  ✅ Category: ${category.name}`);

  // 3 jail cells
  const cellNames = ["⛓️・cell-one", "⛓️・cell-two", "⛓️・cell-three"];
  for (let i = 0; i < config.JAIL_CELL_COUNT; i++) {
    const ch = await guild.channels.create({
      name : cellNames[i],
      type : ChannelType.GuildText,
      parent: category.id,
      topic: `OSSI Detention Cell ${i + 1}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny:  [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: JAIL_ROLE_ID,            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ],
    });
    state.cellChannelIds.push(ch.id);
    console.log(`  ✅ Cell ${i + 1}: ${ch.name}`);
  }

  // 2 holding cells
  const holdNames = ["🔒・holding-one", "🔒・holding-two"];
  for (let i = 0; i < config.HOLDING_CELL_COUNT; i++) {
    const ch = await guild.channels.create({
      name : holdNames[i],
      type : ChannelType.GuildText,
      parent: category.id,
      topic: `OSSI Holding Cell ${i + 1}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny:  [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: JAIL_ROLE_ID,            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ],
    });
    state.holdingChannelIds.push(ch.id);
    console.log(`  ✅ Holding ${i + 1}: ${ch.name}`);
  }

  console.log("✅  Detention facility created.");
}

module.exports = { setupJailChannels };
