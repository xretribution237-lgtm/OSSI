const { EmbedBuilder } = require("discord.js");
const { UNWANTED_ROLE_ID, RECRUIT_ROLE_ID, VERIFY_EMOJI, state } = require("../config");
const { postSOO } = require("../soo/manager");

module.exports = async function handleReaction(reaction, user, client) {
  // Fetch partial reaction/message if needed
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  // Only care about our active verification message
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

    // ── Post SOO embed and begin tracking ────────────────────────────────
    await postSOO(member, client);

    // ── DM: tell them about the SOO next step ─────────────────────────────
    const dmEmbed = new EmbedBuilder()
      .setTitle("✅ Verification Acknowledged — Action Required")
      .setDescription(
        `Welcome, **${member.displayName}**.\n\n` +
        "Your form submission has been recorded and you have been granted the **Recruit 🛦** role.\n\n" +
        "**⚠️ One final step remains before you have full access:**\n" +
        "You must sign your **Statement of Originality (S.O.O)**.\n\n" +
        "Head to the S.O.O channel and reply to your embed with your Discord username to confirm your identity.\n\n" +
        "*You have 72 hours. Failure to sign will result in automatic removal.*"
      )
      .setColor(0xe67e22)
      .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence" })
      .setTimestamp();

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch { /* DMs closed */ }

    console.log(`✅ Verified + SOO triggered: ${user.tag} (${user.id})`);
  } catch (err) {
    console.error(`❌ Verification failed for ${user.tag}:`, err);
  }
};
