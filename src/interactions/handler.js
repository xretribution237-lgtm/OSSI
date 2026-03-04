const { ALLOWED_ROLE_IDS } = require("../config");

// Existing commands
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

// New: meetings
const meetings = require("../meetings/scheduler");

// New: jurisdiction + jail
const jurisdiction = require("../jurisdiction/handler");
const jail         = require("../jail/manager");

// Commands open to everyone
const PUBLIC_COMMANDS = new Set(["userinfo", "serverinfo", "fileorder"]);

function hasAllowedRole(member) {
  return ALLOWED_ROLE_IDS.some(id => member.roles.cache.has(id));
}

module.exports = async function handleInteraction(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  // ── Role gate ──────────────────────────────────────────────────────────────
  if (!PUBLIC_COMMANDS.has(interaction.commandName) && !hasAllowedRole(interaction.member)) {
    return interaction.reply({
      content: "🚫 **Access Denied.** You do not hold the required clearance to use this command.",
      flags: 64,
    });
  }

  try {
    switch (interaction.commandName) {
      // Existing
      case "post_verification":   return await postVerification(interaction, client);
      case "kick":                return await kick(interaction);
      case "ban":                 return await ban(interaction);
      case "unban":               return await unban(interaction);
      case "mute":                return await mute(interaction);
      case "unmute":              return await unmute(interaction);
      case "warn":                return await warn(interaction);
      case "warnings":            return await warnings(interaction);
      case "clearwarnings":       return await clearWarnings(interaction);
      case "purge":               return await purge(interaction);
      case "lock":                return await lock(interaction);
      case "unlock":              return await unlock(interaction);
      case "slowmode":            return await slowmode(interaction);
      case "give_role":           return await giveRole(interaction);
      case "remove_role":         return await removeRole(interaction);
      case "announce":            return await announce(interaction);
      case "embed":               return await embed(interaction);
      case "dm":                  return await dm(interaction);
      case "userinfo":            return await userinfo(interaction);
      case "serverinfo":          return await serverinfo(interaction);

      // Meetings
      case "board_meeting":       return await meetings.postBoardMeeting(interaction, client);
      case "personnel_meeting":   return await meetings.postPersonnelMeeting(interaction, client);

      // Jurisdiction
      case "fileorder":           return await jurisdiction.fileOrder(interaction, client);
      case "sentence":            return await jail.sentence(interaction, client);
      case "offense":             return await jail.offense(interaction, client);
      case "adjust":              return await jail.adjustSentence(interaction, client);
    }
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const msg = { content: "❌ An error occurred executing that command.", flags: 64 };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
};
