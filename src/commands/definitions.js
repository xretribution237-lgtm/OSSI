const { SlashCommandBuilder } = require("discord.js");

module.exports = [
  // ── Verification ────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("post_verification")
    .setDescription("Post the OSSI verification embed in the verification channel."),

  // ── Moderation ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason"))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by ID.")
    .addStringOption(o => o.setName("user_id").setDescription("Discord user ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to mute").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320)),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to unmute").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View warnings for a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to check").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("Clear all warnings for a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true)),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk-delete messages.")
    .addIntegerOption(o => o.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the current channel."),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the current channel."),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode in the current channel.")
    .addIntegerOption(o => o.setName("seconds").setDescription("Delay in seconds (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(21600)),

  // ── Roles ────────────────────────────────────────────────────────────────────
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

  // ── Embeds / Messaging ───────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a custom announcement embed.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to post in").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Embed body").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex colour e.g. ff0000"))
    .addRoleOption(o => o.setName("ping").setDescription("Role to ping")),

  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Post a fully custom embed.")
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

  // ── Info (public) ─────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Display information about a member.")
    .addUserOption(o => o.setName("member").setDescription("Member to inspect (defaults to you)")),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display information about this server."),

  // ── Meetings ─────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("board_meeting")
    .setDescription("Call a board meeting and ping all board-level roles.")
    .addStringOption(o => o.setName("agenda").setDescription("Meeting agenda (optional)")),

  new SlashCommandBuilder()
    .setName("personnel_meeting")
    .setDescription("Call a personnel meeting — Founder, DO, and DA only.")
    .addStringOption(o => o.setName("agenda").setDescription("Meeting agenda (optional)")),

  // ── Jurisdiction ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("fileorder")
    .setDescription("File a formal order against an operative with the Jurisdiction Court.")
    .addUserOption(o => o.setName("who").setDescription("Operative to file against").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Statement of claim / reason").setRequired(true)),

  new SlashCommandBuilder()
    .setName("sentence")
    .setDescription("Issue a formal sentence to an operative.")
    .addUserOption(o => o.setName("who").setDescription("Operative to sentence").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for sentencing").setRequired(true))
    .addStringOption(o => o.setName("length").setDescription("Duration e.g. 1D, 2H, 1Y, 3W").setRequired(true)),

  new SlashCommandBuilder()
    .setName("offense")
    .setDescription("Issue a formal strike offense to an operative.")
    .addUserOption(o => o.setName("who").setDescription("Target operative").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Offense type").setRequired(true)
      .addChoices(
        { name: "Breaking Lawful Order",        value: "breaking_lawful_order" },
        { name: "Inappropriate Use of Conduct", value: "inappropriate_use_of_conduct" },
        { name: "Treason",                      value: "treason" },
      )
    ),

  new SlashCommandBuilder()
    .setName("adjust")
    .setDescription("Adjust or cancel an active sentence.")
    .addUserOption(o => o.setName("who").setDescription("Sentenced operative").setRequired(true))
    .addStringOption(o => o.setName("action").setDescription("What to do").setRequired(true)
      .addChoices(
        { name: "Lengthen", value: "lengthen" },
        { name: "Shorten",  value: "shorten"  },
        { name: "Release",  value: "release"  },
      )
    )
    .addStringOption(o => o.setName("amount").setDescription("Amount to add/remove e.g. 2H, 1D (not needed for Release)")),

].map(cmd => cmd.toJSON());
