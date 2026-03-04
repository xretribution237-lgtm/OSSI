const { EmbedBuilder } = require("discord.js");
const { UNWANTED_ROLE_ID, RECRUIT_ROLE_ID, VERIFY_EMOJI, state } = require("../config");

module.exports = async function handleReaction(reaction, user, client) {
  // Fetch partial reaction/message if needed
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  // Only care about our verification message
  if (reaction.message.id !== state.verificationMessageId) return;

  // Only the unlock emoji
  if (reaction.emoji.name !== VERIFY_EMOJI) return;

  // Ignore bots
  if (user.bot) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  let member;
  try {
    member = await guild.members.fetch(user.id);
  } catch {
    return;
  }

  // ── Remove their reaction immediately so others cannot see it ─────────────
  try {
    await reaction.users.remove(user.id);
  } catch (err) {
    console.warn(`⚠️  Could not remove reaction for ${user.tag}:`, err.message);
  }

  const unwantedRole = guild.roles.cache.get(UNWANTED_ROLE_ID);
  const recruitRole  = guild.roles.cache.get(RECRUIT_ROLE_ID);

  try {
    if (unwantedRole && member.roles.cache.has(UNWANTED_ROLE_ID)) {
      await member.roles.remove(unwantedRole, "OSSI verification completed.");
    }
    if (recruitRole) {
      await member.roles.add(recruitRole, "OSSI verification completed.");
    }

    // ── DM confirmation ────────────────────────────────────────────────────
    const dmEmbed = new EmbedBuilder()
      .setTitle("✅ Verification Acknowledged")
      .setDescription(
        `Welcome, **${member.displayName}**.\n\n` +
        "Your submission has been recorded and your clearance has been granted. " +
        "You now hold the rank of **Recruit 🛦** and may access the server accordingly.\n\n" +
        "*Your file is on record. OSSI is watching.*"
      )
      .setColor(0x00b894)
      .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence" })
      .setTimestamp();

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch {
      // DMs closed – silently skip
    }

    console.log(`✅ Verified: ${user.tag} (${user.id})`);
  } catch (err) {
    console.error(`❌ Role assignment failed for ${user.tag}:`, err);
  }
};
