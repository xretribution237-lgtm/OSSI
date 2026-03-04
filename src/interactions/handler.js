const { ALLOWED_ROLE_IDS, state } = require("../config");

// Existing
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

// Meetings
const meetings = require("../meetings/scheduler");

// Jurisdiction + jail
const jurisdiction = require("../jurisdiction/handler");
const jail         = require("../jail/manager");

// New staff commands
const promote      = require("./commands/promote");
const demote       = require("./commands/demote");
const commend      = require("./commands/commend");
const discharge    = require("./commands/discharge");
const roster       = require("./commands/roster");
const audit        = require("./commands/audit");
const absentee     = require("./commands/absentee");
const watchlist    = require("./commands/watchlist");
const remind       = require("./commands/remind");
const poll         = require("./commands/poll");
const lockdown     = require("./commands/lockdown");
const botstatus    = require("./commands/botstatus");
const missionbrief = require("./commands/missionbrief");

// Tickets (button/modal handling)
const tickets = require("../tickets/manager");

// Public commands — no role gate
const PUBLIC_COMMANDS = new Set(["userinfo", "serverinfo", "fileorder"]);

function hasAllowedRole(member) {
  return ALLOWED_ROLE_IDS.some(id => member.roles.cache.has(id));
}

module.exports = async function handleInteraction(interaction, client) {

  // ── Button interactions ────────────────────────────────────────────────────
  if (interaction.isButton()) {
    if (await tickets.handleTicketButton(interaction, client)) return;
    if (await tickets.handleCloseButton(interaction, client)) return;
    return;
  }

  // ── Modal submissions ──────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    if (await tickets.handleTicketModal(interaction, client)) return;
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // ── Role gate ──────────────────────────────────────────────────────────────
  if (!PUBLIC_COMMANDS.has(interaction.commandName) && !hasAllowedRole(interaction.member)) {
    return interaction.reply({
      content: "🚫 **Access Denied.** You do not hold the required clearance to use this command.",
      flags: 64,
    });
  }

  // ── Watchlist passive alert ────────────────────────────────────────────────
  // (handled in messageCreate — not here)

  try {
    switch (interaction.commandName) {
      case "post_verification":  return await postVerification(interaction, client);
      case "kick":               return await kick(interaction);
      case "ban":                return await ban(interaction);
      case "unban":              return await unban(interaction);
      case "mute":               return await mute(interaction);
      case "unmute":             return await unmute(interaction);
      case "warn":               return await warn(interaction);
      case "warnings":           return await warnings(interaction);
      case "clearwarnings":      return await clearWarnings(interaction);
      case "purge":              return await purge(interaction);
      case "lock":               return await lock(interaction);
      case "unlock":             return await unlock(interaction);
      case "slowmode":           return await slowmode(interaction);
      case "give_role":          return await giveRole(interaction);
      case "remove_role":        return await removeRole(interaction);
      case "announce":           return await announce(interaction);
      case "embed":              return await embed(interaction);
      case "dm":                 return await dm(interaction);
      case "userinfo":           return await userinfo(interaction);
      case "serverinfo":         return await serverinfo(interaction);
      case "board_meeting":      return await meetings.postBoardMeeting(interaction, client);
      case "personnel_meeting":  return await meetings.postPersonnelMeeting(interaction, client);
      case "fileorder":          return await jurisdiction.fileOrder(interaction, client);
      case "sentence":           return await jail.sentence(interaction, client);
      case "offense":            return await jail.offense(interaction, client);
      case "adjust":             return await jail.adjustSentence(interaction, client);
      case "promote":            return await promote(interaction);
      case "demote":             return await demote(interaction);
      case "commend":            return await commend(interaction);
      case "discharge":          return await discharge(interaction);
      case "roster":             return await roster(interaction);
      case "audit":              return await audit(interaction);
      case "absentee":           return await absentee(interaction);
      case "watchlist":          return await watchlist(interaction);
      case "remind":             return await remind(interaction);
      case "poll":               return await poll(interaction);
      case "lockdown":           return await lockdown(interaction);
      case "botstatus":          return await botstatus(interaction);
      case "mission_brief":      return await missionbrief(interaction);
    }
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const msg = { content: "❌ An error occurred.", flags: 64 };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
};
