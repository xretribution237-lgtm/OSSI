const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = [
  // ── Verification ─────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("post_verification").setDescription("Post the OSSI verification embed."),

  // ── Moderation ───────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("kick").setDescription("Kick a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("ban").setDescription("Ban a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason"))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Days of msgs to delete (0-7)").setMinValue(0).setMaxValue(7)),
  new SlashCommandBuilder().setName("unban").setDescription("Unban a user by ID.")
    .addStringOption(o => o.setName("user_id").setDescription("Discord user ID").setRequired(true)),
  new SlashCommandBuilder().setName("mute").setDescription("Timeout a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Minutes").setRequired(true).setMinValue(1).setMaxValue(40320)),
  new SlashCommandBuilder().setName("unmute").setDescription("Remove timeout.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true)),
  new SlashCommandBuilder().setName("warn").setDescription("Warn a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("View warnings for a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true)),
  new SlashCommandBuilder().setName("clearwarnings").setDescription("Clear all warnings for a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true)),
  new SlashCommandBuilder().setName("purge").setDescription("Bulk-delete messages.")
    .addIntegerOption(o => o.setName("amount").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName("lock").setDescription("Lock the current channel."),
  new SlashCommandBuilder().setName("unlock").setDescription("Unlock the current channel."),
  new SlashCommandBuilder().setName("slowmode").setDescription("Set slowmode.")
    .addIntegerOption(o => o.setName("seconds").setDescription("Seconds (0 = off)").setRequired(true).setMinValue(0).setMaxValue(21600)),
  new SlashCommandBuilder().setName("give_role").setDescription("Give a role to a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)),
  new SlashCommandBuilder().setName("remove_role").setDescription("Remove a role from a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)),

  // ── Embeds / Messaging ───────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("announce").setDescription("Post a custom announcement embed.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Body").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex colour"))
    .addRoleOption(o => o.setName("ping").setDescription("Role to ping")),
  new SlashCommandBuilder().setName("embed").setDescription("Post a fully custom embed.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(o => o.setName("description").setDescription("Body").setRequired(true))
    .addStringOption(o => o.setName("color").setDescription("Hex colour"))
    .addStringOption(o => o.setName("footer").setDescription("Footer"))
    .addStringOption(o => o.setName("image_url").setDescription("Image URL")),
  new SlashCommandBuilder().setName("dm").setDescription("Send a DM embed to a member.")
    .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true)),

  // ── Info (public) ─────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("userinfo").setDescription("Info about a member.")
    .addUserOption(o => o.setName("member").setDescription("Member (defaults to you)")),
  new SlashCommandBuilder().setName("serverinfo").setDescription("Info about this server."),

  // ── Meetings ─────────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("board_meeting").setDescription("Call a board meeting.")
    .addStringOption(o => o.setName("agenda").setDescription("Agenda (optional)")),
  new SlashCommandBuilder().setName("personnel_meeting").setDescription("Call a personnel meeting (Founder/DO/DA only).")
    .addStringOption(o => o.setName("agenda").setDescription("Agenda (optional)")),

  // ── Jurisdiction ─────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("fileorder").setDescription("File a formal order with the Jurisdiction Court.")
    .addUserOption(o => o.setName("who").setDescription("Operative to file against").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Statement of claim").setRequired(true)),
  new SlashCommandBuilder().setName("sentence").setDescription("Issue a formal sentence.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true))
    .addStringOption(o => o.setName("length").setDescription("e.g. 1D 2H 1Y 3W").setRequired(true)),
  new SlashCommandBuilder().setName("offense").setDescription("Issue a strike offense.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Offense type").setRequired(true)
      .addChoices(
        { name: "Breaking Lawful Order",        value: "breaking_lawful_order" },
        { name: "Inappropriate Use of Conduct", value: "inappropriate_use_of_conduct" },
        { name: "Treason",                      value: "treason" },
      )),
  new SlashCommandBuilder().setName("adjust").setDescription("Adjust or cancel an active sentence.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("action").setDescription("Action").setRequired(true)
      .addChoices(
        { name: "Lengthen", value: "lengthen" },
        { name: "Shorten",  value: "shorten"  },
        { name: "Release",  value: "release"  },
      ))
    .addStringOption(o => o.setName("amount").setDescription("e.g. 2H 1D (not needed for Release)")),

  // ── Staff — Personnel ────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName("promote").setDescription("Formally promote an operative.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addRoleOption(o => o.setName("new_role").setDescription("New rank role").setRequired(true))
    .addRoleOption(o => o.setName("old_role").setDescription("Old rank role to remove (optional)")),
  new SlashCommandBuilder().setName("demote").setDescription("Formally demote an operative.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addRoleOption(o => o.setName("old_role").setDescription("Role to remove").setRequired(true))
    .addRoleOption(o => o.setName("new_role").setDescription("New role to assign (optional)"))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("commend").setDescription("Issue a formal commendation.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
  new SlashCommandBuilder().setName("discharge").setDescription("Formally discharge an operative.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Discharge type").setRequired(true)
      .addChoices(
        { name: "Honourable",    value: "honourable"   },
        { name: "Dishonourable", value: "dishonorable" },
      ))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("roster").setDescription("Display the full operative roster."),
  new SlashCommandBuilder().setName("audit").setDescription("Pull a full record on an operative.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true)),
  new SlashCommandBuilder().setName("absentee").setDescription("Log an operative as officially absent.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for absence").setRequired(true))
    .addStringOption(o => o.setName("return_date").setDescription("Expected return date e.g. 2025-12-01").setRequired(true)),
  new SlashCommandBuilder().setName("watchlist").setDescription("Add or remove an operative from the watchlist.")
    .addStringOption(o => o.setName("action").setDescription("Action").setRequired(true)
      .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }))
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason (required for add)")),
  new SlashCommandBuilder().setName("remind").setDescription("Set a timed reminder for an operative.")
    .addUserOption(o => o.setName("who").setDescription("Operative").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Reminder message").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("e.g. 2H 1D 30M").setRequired(true)),
  new SlashCommandBuilder().setName("poll").setDescription("Post a reaction poll (closes after 24h).")
    .addStringOption(o => o.setName("question").setDescription("Poll question").setRequired(true))
    .addStringOption(o => o.setName("option1").setDescription("Option 1").setRequired(true))
    .addStringOption(o => o.setName("option2").setDescription("Option 2").setRequired(true))
    .addStringOption(o => o.setName("option3").setDescription("Option 3"))
    .addStringOption(o => o.setName("option4").setDescription("Option 4")),
  new SlashCommandBuilder().setName("lockdown").setDescription("Lock or unlock every channel in the server.")
    .addStringOption(o => o.setName("action").setDescription("Action").setRequired(true)
      .addChoices({ name: "Initiate Lockdown", value: "lock" }, { name: "Lift Lockdown", value: "lift" })),
  new SlashCommandBuilder().setName("botstatus").setDescription("Show bot uptime and system statistics."),
  new SlashCommandBuilder().setName("mission_brief").setDescription("Post a classified mission briefing.")
    .addStringOption(o => o.setName("title").setDescription("Mission title").setRequired(true))
    .addStringOption(o => o.setName("details").setDescription("Full briefing details").setRequired(true))
    .addStringOption(o => o.setName("classification").setDescription("Classification level").setRequired(true)
      .addChoices(
        { name: "UNCLASSIFIED",  value: "UNCLASSIFIED"  },
        { name: "CONFIDENTIAL",  value: "CONFIDENTIAL"  },
        { name: "SECRET",        value: "SECRET"        },
        { name: "TOP SECRET",    value: "TOP SECRET"    },
      ))
    .addRoleOption(o => o.setName("ping").setDescription("Role to ping (optional)"))
    .addChannelOption(o => o.setName("channel").setDescription("Channel to post in (defaults to current)")),

].map(cmd => cmd.toJSON());
