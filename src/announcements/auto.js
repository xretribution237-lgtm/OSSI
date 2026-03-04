/**
 * announcements/auto.js
 *
 * Five auto-announcement types, each on their own interval:
 *  1. Daily Intel Briefing
 *  2. Weekly Op-Sec Reminder
 *  3. Lore / Motivational Messages (every 6h)
 *  4. Threat Level Update (twice daily)
 *  5. Staff Activity Check-In (every 3 days)
 */

const { EmbedBuilder } = require("discord.js");
const config = require("../config");

// ─── Utility ──────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function now()     { return Math.floor(Date.now() / 1000); }

// ─────────────────────────────────────────────────────────────────────────────
//  CONTENT POOLS
// ─────────────────────────────────────────────────────────────────────────────

const INTEL_BRIEFINGS = [
  {
    title    : "📡 DAILY INTELLIGENCE BRIEFING — FIELD REPORT",
    codename : "OPERATION IRONVEIL",
    summary  : "Intercepts from Sector 7 suggest increased chatter among unaffiliated operatives. Cross-reference all recent recruitment logs against known threat profiles. Analysts are advised to flag any discrepancies in onboarding documentation.",
    action   : "All Directorate personnel to review their sector reports before EOD.",
    threat   : "ELEVATED",
    color    : 0x0d1b4a,
  },
  {
    title    : "📡 DAILY INTELLIGENCE BRIEFING — STRATEGIC UPDATE",
    codename : "OPERATION COLDFRAME",
    summary  : "Satellite imagery analysis has confirmed movement in previously dormant operational zones. The Directorate of Analysis is currently processing a backlog of signal intelligence that may contain actionable data.",
    action   : "DO and DA to convene a sub-session at their earliest availability.",
    threat   : "MODERATE",
    color    : 0x0d2a1b,
  },
  {
    title    : "📡 DAILY INTELLIGENCE BRIEFING — INTERNAL AUDIT",
    codename : "PROTOCOL SPECTRE",
    summary  : "Routine internal audit cycle has been initiated. All operatives should ensure their clearance documentation is current. Any operative unable to verify their credentials within 48 hours will be flagged for review.",
    action   : "Verify your documentation. Report anomalies to the Directorate immediately.",
    threat   : "LOW",
    color    : 0x1a1a0d,
  },
  {
    title    : "📡 DAILY INTELLIGENCE BRIEFING — COMMS INTERCEPT",
    codename : "SIGNAL BLACKOUT",
    summary  : "An unidentified communications signal was detected on monitored frequencies at 03:14 UTC. Source remains unattributed. Cryptographic division is working to decrypt the payload. No action required at this time — situational awareness only.",
    action   : "Monitor all incoming communications. Report anything unusual to your superior.",
    threat   : "UNKNOWN",
    color    : 0x2a1a0d,
  },
  {
    title    : "📡 DAILY INTELLIGENCE BRIEFING — PERSONNEL SWEEP",
    codename : "OPERATION CLEANHOUSE",
    summary  : "Scheduled personnel integrity sweep is underway. All operatives should be aware that their activity, communications, and conduct are under standard review as part of OSSI's ongoing internal security protocol.",
    action   : "Conduct yourselves in accordance with the OSSI Code of Conduct at all times.",
    threat   : "LOW",
    color    : 0x0d1b4a,
  },
];

const OPSEC_REMINDERS = [
  {
    title  : "🔐 WEEKLY OP-SEC REMINDER — INFORMATION SECURITY",
    body   : "**Never share operational details outside of designated channels.**\n\nAll classified discussions must remain within OSSI infrastructure. External platforms — including personal DMs on unmonitored services — are not considered secure. Treat every channel outside this server as potentially compromised.",
    tip    : "If you wouldn't say it in a briefing room, don't say it anywhere else.",
  },
  {
    title  : "🔐 WEEKLY OP-SEC REMINDER — IDENTITY PROTECTION",
    body   : "**Your identity within OSSI is classified.**\n\nDo not disclose your rank, role, or operational assignments to individuals outside of cleared personnel. This includes indirect disclosure — social engineering remains the most effective attack vector against our organisation.",
    tip    : "Assume every unsolicited contact is an attempt to extract intelligence.",
  },
  {
    title  : "🔐 WEEKLY OP-SEC REMINDER — COMMUNICATIONS HYGIENE",
    body   : "**All communications within OSSI channels are logged.**\n\nThis is not a surveillance measure — it is a protective one. Logs allow us to investigate misconduct, verify timelines, and protect operatives from false accusations. Behave as though everything is on the record, because it is.",
    tip    : "Clarity and precision in all written communications. No ambiguity.",
  },
  {
    title  : "🔐 WEEKLY OP-SEC REMINDER — CONDUCT STANDARDS",
    body   : "**OSSI holds its operatives to the highest standards of conduct.**\n\nAny behaviour that would bring discredit upon the organisation — in this server or externally — is subject to formal review. You represent OSSI at all times, not only when on duty.",
    tip    : "Discipline is the foundation of operational effectiveness.",
  },
];

const LORE_MESSAGES = [
  {
    title : "📜 FIELD COMMUNIQUÉ — FROM THE DESK OF OSSI COMMAND",
    body  : "The intelligence community has always operated in the spaces between what is known and what can be proven. OSSI exists precisely in that gap. Every operative here was chosen not merely for their skills, but for their discretion, their loyalty, and their willingness to operate without recognition.\n\nThe world does not know our name. That is by design. Our success is measured not in headlines, but in the silence that follows a crisis that never happened.",
    quote : "\"The most effective weapon is one that is never seen.\"",
    color : 0x0d1b2a,
  },
  {
    title : "📜 HISTORICAL RECORD — OSSI FOUNDING DOCTRINE",
    body  : "When OSSI was established, its founding directive was simple: *operate where others cannot, achieve what others will not, and leave no trace*. That doctrine has not changed. Every recruit who signs their Statement of Originality inherits that mandate.\n\nWe are not a blunt instrument. We are a scalpel — precise, deliberate, and irreplaceable.",
    quote : "\"In the absence of information, assumptions become policy. We do not assume.\"",
    color : 0x1a0d2a,
  },
  {
    title : "📜 MOTIVATIONAL DISPATCH — DIRECTORATE COMMAND",
    body  : "There will be moments in your service where the right course of action is unclear. When that happens, return to your training, consult your chain of command, and trust the process. OSSI does not reward recklessness. It rewards patience, precision, and the courage to act when the moment demands it.",
    quote : "\"Preparation is not the enemy of spontaneity — it is its prerequisite.\"",
    color : 0x0d2a1b,
  },
  {
    title : "📜 OPERATIONAL PHILOSOPHY — INTELLIGENCE DIVISION",
    body  : "Raw intelligence is not knowledge. Data without context is noise. Every analyst and operative within OSSI is trained to ask not just *what* — but *why*, *when*, and *who benefits*. The enemy of good intelligence is not secrecy. It is the assumption that you already have the full picture.",
    quote : "\"The analyst who says they are certain is the most dangerous person in the room.\"",
    color : 0x2a1a0d,
  },
  {
    title : "📜 INTERNAL MEMORANDUM — CULTURE & COHESION",
    body  : "OSSI is not a hierarchy of individuals. It is a system of roles, each essential, none expendable. The Founder sets direction. The Directorates execute it. Every operative below carries it forward. Remove any link from that chain and the whole suffers.\n\nTake pride in your rank — not because of the authority it carries, but because of the trust it represents.",
    quote : "\"Rank is not a reward. It is a responsibility.\"",
    color : 0x0d1b2a,
  },
  {
    title : "📜 FIELD NOTE — ANONYMOUS OPERATIVE, CLASSIFIED DATE",
    body  : "Recovered from a decommissioned secure channel. Author unknown. Classification level reduced for internal distribution.\n\n*\"The hours are long. The recognition is nonexistent. The work is harder than I ever imagined. And yet — I would not trade a single day of it. This organisation does things that matter. Quietly. Without applause. That is exactly the kind of work worth doing.\"*",
    quote : "\"Not all service is visible. Not all sacrifice is acknowledged. Both matter.\"",
    color : 0x1a1a1a,
  },
];

const THREAT_LEVELS = [
  { level: "GREEN",    label: "✅ THREAT LEVEL: GREEN — ALL CLEAR",    color: 0x00b894, body: "No active threats detected across monitored channels. Standard operational posture maintained. All personnel may proceed with scheduled activities under normal protocols." },
  { level: "GREEN",    label: "✅ THREAT LEVEL: GREEN — NOMINAL",       color: 0x00b894, body: "Intelligence sweep complete. No anomalies detected. Internal and external monitoring systems are functioning within expected parameters. Remain vigilant." },
  { level: "YELLOW",   label: "⚠️ THREAT LEVEL: YELLOW — ELEVATED",    color: 0xf39c12, body: "Unverified intelligence suggests potential activity of interest. No confirmed threat at this time. All operatives should increase situational awareness and report any unusual contacts or communications." },
  { level: "YELLOW",   label: "⚠️ THREAT LEVEL: YELLOW — ADVISORY",    color: 0xf39c12, body: "An advisory has been issued following a flagged anomaly in recent communications traffic. Details are being assessed by the Directorate of Analysis. Senior staff have been briefed." },
  { level: "ORANGE",   label: "🔶 THREAT LEVEL: ORANGE — HIGH",         color: 0xe67e22, body: "A credible threat has been identified and is under active assessment. Non-essential communications should be limited. All operatives should confirm their secure contact protocols are current and accessible." },
  { level: "RED",      label: "🚨 THREAT LEVEL: RED — CRITICAL",        color: 0xe74c3c, body: "A critical-level threat has been confirmed. All operatives are to stand by for direct orders from the Directorate. Non-senior personnel should refrain from independent action until further notice. This is not a drill." },
];

const CHECKIN_MESSAGES = [
  {
    title : "📋 STAFF ACTIVITY CHECK-IN — DIRECTORATE COMMAND",
    body  : "This is a routine activity check-in for all senior staff. The Directorate requires confirmation that all Founders, Directorate Officers, and senior operatives are active and available.\n\nIf you are temporarily unavailable, please log an absence report using the `/absentee` command with your expected return date.",
    cta   : "React with ✅ to confirm your presence, or file an absentee report.",
  },
  {
    title : "📋 OPERATIONAL READINESS CHECK — OSSI COMMAND",
    body  : "Senior staff check-in. All personnel in leadership positions are requested to confirm operational readiness. OSSI maintains a minimum staffing threshold for all critical functions. Your confirmation ensures continuity of operations.",
    cta   : "Respond in this channel or use `/absentee` if you will be unavailable.",
  },
  {
    title : "📋 WEEKLY HEADCOUNT — INTERNAL AFFAIRS",
    body  : "Internal affairs is conducting a routine headcount of active senior personnel. This is standard procedure and does not indicate any investigation or concern. All senior operatives should acknowledge this message within 24 hours.",
    cta   : "Acknowledge below or notify your superior if you cannot respond.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  POST FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function postIntelBriefing(client) {
  const ch = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (!ch) return;
  const data = pick(INTEL_BRIEFINGS);
  const threatColors = { LOW: 0x00b894, MODERATE: 0xf39c12, ELEVATED: 0xe67e22, HIGH: 0xe74c3c, UNKNOWN: 0x7f8c8d };

  const embed = new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(
      `**CODENAME:** \`${data.codename}\`\n` +
      `**CLASSIFICATION:** TOP SECRET // NOFORN\n` +
      `**ISSUED:** <t:${now()}:F>\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `**SUMMARY:**\n${data.summary}\n\n` +
      `**REQUIRED ACTION:**\n> ${data.action}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(threatColors[data.threat] || data.color)
    .addFields(
      { name: "Threat Assessment", value: data.threat,                               inline: true },
      { name: "Next Briefing",     value: `<t:${now() + 86400}:R>`,                  inline: true },
      { name: "Distribution",      value: "ALL CLEARED PERSONNEL",                   inline: true },
    )
    .setFooter({ text: "OSSI – Intelligence Division  •  Handle with extreme care" })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log(`📡 Intel briefing posted: ${data.codename}`);
}

async function postOpsecReminder(client) {
  const ch = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (!ch) return;
  const data = pick(OPSEC_REMINDERS);

  const embed = new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(
      `**ISSUED:** <t:${now()}:F>\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `${data.body}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💡 **Operative Tip:**\n> *${data.tip}*`
    )
    .setColor(0x1a0d2a)
    .setFooter({ text: "OSSI – Operational Security Division  •  Weekly Standing Order" })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log("🔐 Op-sec reminder posted.");
}

async function postLoreMessage(client) {
  const ch = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (!ch) return;
  const data = pick(LORE_MESSAGES);

  const embed = new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(
      `**TRANSMITTED:** <t:${now()}:F>\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `${data.body}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*${data.quote}*`
    )
    .setColor(data.color)
    .setFooter({ text: "OSSI – Command Transmission  •  For Internal Distribution Only" })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log("📜 Lore message posted.");
}

async function postThreatLevel(client) {
  const ch = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (!ch) return;
  // Weight towards lower threat levels (more realistic day-to-day)
  const weights = [30, 30, 20, 20, 10, 5];
  const total   = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  let data;
  for (let i = 0; i < THREAT_LEVELS.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { data = THREAT_LEVELS[i]; break; }
  }
  data = data || THREAT_LEVELS[0];

  const embed = new EmbedBuilder()
    .setTitle(data.label)
    .setDescription(
      `**ISSUED BY:** OSSI Security Command\n` +
      `**TIME:** <t:${now()}:F>\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `${data.body}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(data.color)
    .addFields(
      { name: "Level",       value: data.level,                     inline: true },
      { name: "Next Update", value: `<t:${now() + 43200}:R>`,       inline: true },
    )
    .setFooter({ text: "OSSI – Security Command  •  All operatives must acknowledge" })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
  console.log(`🔴 Threat level posted: ${data.level}`);
}

async function postActivityCheckin(client) {
  const ch = client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (!ch) return;
  const data       = pick(CHECKIN_MESSAGES);
  const pingStr    = config.ALLOWED_ROLE_IDS.map(id => `<@&${id}>`).join(" ");

  const embed = new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(
      `${pingStr}\n\n` +
      `**ISSUED:** <t:${now()}:F>\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `${data.body}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `**> ${data.cta}**`
    )
    .setColor(0x0d2a2a)
    .setFooter({ text: "OSSI – Internal Affairs  •  Response required within 24 hours" })
    .setTimestamp();

  await ch.send({ content: pingStr, embeds: [embed] });
  console.log("📋 Staff activity check-in posted.");
}

// ─────────────────────────────────────────────────────────────────────────────
//  START ALL SCHEDULERS
// ─────────────────────────────────────────────────────────────────────────────
function startAnnouncementSchedulers(client) {
  const { ANNOUNCEMENT_INTERVALS: I } = config;

  // Post once immediately on startup (staggered so they don't all fire at once)
  setTimeout(() => postIntelBriefing(client),   5_000);
  setTimeout(() => postThreatLevel(client),    15_000);
  setTimeout(() => postLoreMessage(client),    30_000);
  setTimeout(() => postOpsecReminder(client),  45_000);
  setTimeout(() => postActivityCheckin(client),60_000);

  // Then recurring
  setInterval(() => postIntelBriefing(client),   I.INTEL_BRIEFING);
  setInterval(() => postThreatLevel(client),     I.THREAT_LEVEL);
  setInterval(() => postLoreMessage(client),     I.LORE_MESSAGE);
  setInterval(() => postOpsecReminder(client),   I.OPSEC_REMINDER);
  setInterval(() => postActivityCheckin(client), I.ACTIVITY_CHECKIN);

  console.log("📣 Auto-announcement schedulers started.");
}

module.exports = { startAnnouncementSchedulers };
