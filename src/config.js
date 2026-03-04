module.exports = {
  // ── Channels ─────────────────────────────────────────────────────────────────
  VERIFICATION_CHANNEL_ID  : "1478508875182379159",
  WELCOME_CHANNEL_ID       : "1478581633228738570",
  LEAVE_CHANNEL_ID         : "1478581751218700339",
  SOO_CHANNEL_ID           : "1478588400260087878",
  ANNOUNCEMENTS_CHANNEL_ID : "1478595178037121064",
  TICKET_CHANNEL_ID        : "1478765274667683994",
  TICKET_LOG_CHANNEL_ID    : "1478775415270014997",

  MEETING_CHANNELS: {
    SERVER      : "1478595680862867519",
    BOARD       : "1478595761288646697",
    PERSONNEL   : "1478596087085535312",
    JURISDICTION: "1478596277163004126",
  },

  // ── Roles ─────────────────────────────────────────────────────────────────────
  UNWANTED_ROLE_ID : "1478548574722855044",
  RECRUIT_ROLE_ID  : "1478522061830881523",
  JAIL_ROLE_ID     : "1478600061272195173",

  ALLOWED_ROLE_IDS : [
    "1478519160706433044", // Founder of OSSI 👑
    "1478519385105895444", // Directorate of Operations ✪
    "1478519645014065212", // Directorate of Analysis 📌
  ],

  BOARD_ROLE_IDS : [
    "1478519160706433044",
    "1478519385105895444",
    "1478519645014065212",
    "1478520222511005816",
    "1478520722736283751",
    "1478521290070425600",
    "1478521523102023691",
  ],

  JURISDICTION_ROLE_IDS : [
    "1478519160706433044",
    "1478519385105895444",
    "1478519645014065212",
    "1478521848441471108",
  ],

  // ── Verification ─────────────────────────────────────────────────────────────
  FORM_LINK    : "https://docs.google.com/document/d/1dDOZdpQVcfgf3fq8iO3FThOg9R6V2gEMtq3TG6G-Xts/edit?usp=sharing",
  VERIFY_EMOJI : "🔓",

  // ── SOO ───────────────────────────────────────────────────────────────────────
  SOO_REMINDER_INTERVAL_MS : 60 * 60 * 1000,
  SOO_EXPIRY_MS            : 3 * 24 * 60 * 60 * 1000,

  // ── Jail ──────────────────────────────────────────────────────────────────────
  JAIL_CELL_COUNT    : 3,
  HOLDING_CELL_COUNT : 2,
  MAX_STRIKES        : 3,
  STRIKE_SENTENCE_MS : 3 * 60 * 60 * 1000,

  // ── Announcements ─────────────────────────────────────────────────────────────
  // ONE announcement type per day, rotating through all 5 types
  // Each individual type fires every 5 days (so together = 1/day)
  ANNOUNCEMENT_INTERVALS: {
    INTEL_BRIEFING   : 5  * 24 * 60 * 60 * 1000, // every 5 days
    OPSEC_REMINDER   : 5  * 24 * 60 * 60 * 1000,
    LORE_MESSAGE     : 5  * 24 * 60 * 60 * 1000,
    THREAT_LEVEL     : 5  * 24 * 60 * 60 * 1000,
    ACTIVITY_CHECKIN : 5  * 24 * 60 * 60 * 1000,
  },

  // ── In-memory state ───────────────────────────────────────────────────────────
  state: {
    verificationMessageId : null,
    warnLog               : {},
    sooLog                : {},
    strikeLog             : {},
    jailCells             : [null, null, null],
    holdingCells          : [null, null],
    cellChannelIds        : [],
    holdingChannelIds     : [],
    detentionCategoryId   : null,
    ticketCounter         : 0,
    ticketLog             : {},
    watchlist             : {},
    absentLog             : {},
    commendLog            : {},
    reminders             : [],
  },
};
