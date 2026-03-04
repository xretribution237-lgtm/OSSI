module.exports = {
  // ── Channels ────────────────────────────────────────────────────────────────
  VERIFICATION_CHANNEL_ID  : "1478508875182379159",
  WELCOME_CHANNEL_ID       : "1478581633228738570",
  LEAVE_CHANNEL_ID         : "1478581751218700339",
  SOO_CHANNEL_ID           : "1478588400260087878",
  ANNOUNCEMENTS_CHANNEL_ID : "1478595178037121064",

  // Meeting channels
  MEETING_CHANNELS: {
    SERVER     : "1478595680862867519",  // 🌐server-meeting
    BOARD      : "1478595761288646697",  // 💼board-meeting
    PERSONNEL  : "1478596087085535312",  // 📜personnel-meeting
    JURISDICTION: "1478596277163004126", // 🏛️jurisdiction-meeting
  },

  // ── Roles ───────────────────────────────────────────────────────────────────
  UNWANTED_ROLE_ID : "1478548574722855044",
  RECRUIT_ROLE_ID  : "1478522061830881523",
  JAIL_ROLE_ID     : "1478600061272195173",

  // Roles permitted to use staff commands
  ALLOWED_ROLE_IDS : [
    "1478519160706433044", // Founder of OSSI 👑
    "1478519385105895444", // Directorate of Operations ✪
    "1478519645014065212", // Directorate of Analysis 📌
  ],

  // Board meeting roles (all senior staff)
  BOARD_ROLE_IDS : [
    "1478519160706433044", // Founder
    "1478519385105895444", // DO
    "1478519645014065212", // DA
    "1478520222511005816",
    "1478520722736283751",
    "1478521290070425600",
    "1478521523102023691",
  ],

  // Jurisdiction alert roles
  JURISDICTION_ROLE_IDS : [
    "1478519160706433044", // Founder
    "1478519385105895444", // DO
    "1478519645014065212", // DA
    "1478521848441471108", // Judge/Court role
  ],

  // ── Verification ────────────────────────────────────────────────────────────
  FORM_LINK    : "https://docs.google.com/document/d/1dDOZdpQVcfgf3fq8iO3FThOg9R6V2gEMtq3TG6G-Xts/edit?usp=sharing",
  VERIFY_EMOJI : "🔓",

  // ── SOO settings ────────────────────────────────────────────────────────────
  SOO_REMINDER_INTERVAL_MS : 60 * 60 * 1000,        // 1 hour
  SOO_EXPIRY_MS            : 3 * 24 * 60 * 60 * 1000, // 72 hours

  // ── Jail settings ────────────────────────────────────────────────────────────
  JAIL_CELL_COUNT    : 3,
  HOLDING_CELL_COUNT : 2,
  MAX_STRIKES        : 3,
  STRIKE_SENTENCE_MS : 3 * 60 * 60 * 1000, // 3 hours for 3 strikes

  // ── In-memory state ─────────────────────────────────────────────────────────
  state: {
    verificationMessageId : null,
    warnLog               : {},

    // SOO: { userId: { messageId, username, verifiedAt, signed } }
    sooLog : {},

    // Strikes: { userId: { count, offenses: [] } }
    strikeLog : {},

    // Jail cells: array of { userId, messageId, channelId, roles, endsAt, holdingQueue: false }
    jailCells    : [null, null, null],
    holdingCells : [null, null],

    // Cell channel IDs (populated on first run by jail/setup.js)
    cellChannelIds    : [],  // [id1, id2, id3]
    holdingChannelIds : [],  // [id1, id2]
    detentionCategoryId : null,
  },
};
