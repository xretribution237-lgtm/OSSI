/**
 * jail/setup.js
 * Creates the ⛓️ DETENTION FACILITY category + cell channels on first run.
 * Jailed members can ONLY see their assigned cell (read-only).
 * All other roles/everyone are denied access.
 */

const { ChannelType, PermissionFlagsBits } = require("discord.js");
const config = require("../config");

async function setupJailChannels(guild) {
  const { state, JAIL_ROLE_ID } = config;

  // Already set up this session
  if (state.cellChannelIds.length === config.JAIL_CELL_COUNT) return;

  console.log("🏗️  Creating detention facility channels...");

  // ── Create category ──────────────────────────────────────────────────────
  const category = await guild.channels.create({
    name: "⛓️ DETENTION FACILITY",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
    ],
  });
  state.detentionCategoryId = category.id;
  console.log(`  ✅ Category created: ${category.name} (${category.id})`);

  // ── Create 3 jail cells ──────────────────────────────────────────────────
  const cellNames = ["⛓️・cell-one", "⛓️・cell-two", "⛓️・cell-three"];
  for (let i = 0; i < config.JAIL_CELL_COUNT; i++) {
    const ch = await guild.channels.create({
      name: cellNames[i],
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `OSSI Detention Cell ${i + 1} — Occupied status tracked by bot.`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        // Jail role itself gets view but NOT send — bot posts for them
        {
          id: JAIL_ROLE_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny:  [PermissionFlagsBits.SendMessages],
        },
      ],
    });
    state.cellChannelIds.push(ch.id);
    console.log(`  ✅ Cell ${i + 1}: ${ch.name} (${ch.id})`);
  }

  // ── Create 2 holding cells ───────────────────────────────────────────────
  const holdNames = ["🔒・holding-one", "🔒・holding-two"];
  for (let i = 0; i < config.HOLDING_CELL_COUNT; i++) {
    const ch = await guild.channels.create({
      name: holdNames[i],
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `OSSI Holding Cell ${i + 1} — Awaiting transfer to main detention.`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: JAIL_ROLE_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny:  [PermissionFlagsBits.SendMessages],
        },
      ],
    });
    state.holdingChannelIds.push(ch.id);
    console.log(`  ✅ Holding ${i + 1}: ${ch.name} (${ch.id})`);
  }

  console.log("✅  Detention facility fully constructed.");
}

module.exports = { setupJailChannels };
