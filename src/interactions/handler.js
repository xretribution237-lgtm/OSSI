const { ALLOWED_ROLE_IDS } = require("../config");

const postVerification = require("./commands/postVerification");
const kick             = require("./commands/kick");
const ban              = require("./commands/ban");
const unban            = require("./commands/unban");
const mute             = require("./commands/mute");
const unmute           = require("./commands/unmute");
const warn             = require("./commands/warn");
const warnings         = require("./commands/warnings");
const clearWarnings    = require("./commands/clearWarnings");
const purge            = require("./commands/purge");
const lock             = require("./commands/lock");
const unlock           = require("./commands/unlock");
const slowmode         = require("./commands/slowmode");
const giveRole         = require("./commands/giveRole");
const removeRole       = require("./commands/removeRole");
const announce         = require("./commands/announce");
const embed            = require("./commands/embed");
const dm               = require("./commands/dm");
const userinfo         = require("./commands/userinfo");
const serverinfo       = require("./commands/serverinfo");

const handlers = {
  post_verification : postVerification,
  kick              : kick,
  ban               : ban,
  unban             : unban,
  mute              : mute,
  unmute            : unmute,
  warn              : warn,
  warnings          : warnings,
  clearwarnings     : clearWarnings,
  purge             : purge,
  lock              : lock,
  unlock            : unlock,
  slowmode          : slowmode,
  give_role         : giveRole,
  remove_role       : removeRole,
  announce          : announce,
  embed             : embed,
  dm                : dm,
  userinfo          : userinfo,
  serverinfo        : serverinfo,
};

// Commands that any member can use (no role restriction)
const PUBLIC_COMMANDS = new Set(["userinfo", "serverinfo"]);

function hasAllowedRole(member) {
  return ALLOWED_ROLE_IDS.some(id => member.roles.cache.has(id));
}

module.exports = async function handleInteraction(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  const handler = handlers[interaction.commandName];
  if (!handler) return;

  // ── Role gate ─────────────────────────────────────────────────────────────
  if (!PUBLIC_COMMANDS.has(interaction.commandName) && !hasAllowedRole(interaction.member)) {
    return interaction.reply({
      content: "🚫 **Access Denied.** You do not hold the required clearance to use this command.",
      flags: 64,
    });
  }

  try {
    await handler(interaction, client);
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const msg = { content: "❌ An error occurred executing that command.", flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
};
