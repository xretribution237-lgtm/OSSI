const { SlashCommandBuilder } = require("discord.js");

// NOTE: Permission enforcement is handled via role checks in interactions/handler.js
// (Founder of OSSI, Directorate of Operations, Directorate of Analysis).
// Public commands (userinfo, serverinfo) are open to everyone.

module.exports = [
  // ── Verification ────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("post_verification")
    .setDescription("Post the OSSI verification embed in the verification channel."),

  // ── Moderation ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server.")
    .addUserOption(o => o.setName("member").setDescription("Member to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server.")
    .addUserOption(o => o.setName("member").setDescription("Member to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason"))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by their Discord ID.")
    .addStringOption(o => o.setName("user_id").setDescription("Discord user ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout (mute) a member for a number of minutes.")
    .addUserOption(o => o.setName("member").setDescription("Member to mute").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320)),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to unmute").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member and DM them.")
    .addUserOption(o => o.setName("member").setDescription("Member to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for warning").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View all warnings for a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to check").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("Clear all warnings for a member.")
    .addUserOption(o => o.setName("member").setDescription("Member whose warnings to clear").setRequired(true)),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk-delete messages from this channel.")
    .addIntegerOption(o => o.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the current channel (prevent members from sending messages)."),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the current channel."),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode in the current channel.")
    .addIntegerOption(o => o.setName("seconds").setDescription("Delay in seconds (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(21600)),

  // ── Roles ───────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("give_role")
    .setDescription("Give a role to a member.")
    .addUserOption(o => o.setName("member").setDescription("Target member").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role to assign").setRequired(true)),

  new SlashCommandBuilder()
    .setName("remove_role")
    .setDescription("Remove a role from a member.")
    .addUserOption(o => o.setName("member").setDescription("Target member").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true)),

  // ── Embeds / Messaging ──────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a custom announcement embed.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to post in").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Embed body").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex colour e.g. ff0000 (default: dark)"))
    .addRoleOption(o => o.setName("ping").setDescription("Role to ping")),

  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Post a fully custom embed in any channel.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(o => o.setName("description").setDescription("Body").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex colour"))
    .addStringOption(o => o.setName("footer").setDescription("Footer text"))
    .addStringOption(o => o.setName("image_url").setDescription("Image URL")),

  new SlashCommandBuilder()
    .setName("dm")
    .setDescription("Send a DM embed to a member.")
    .addUserOption(o => o.setName("member").setDescription("Target member").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Embed message").setRequired(true)),

  // ── Info (public) ────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Display information about a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to inspect (defaults to you)")),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display information about this server."),

].map(cmd => cmd.toJSON());
