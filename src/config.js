module.exports = {
  // ── Channels ────────────────────────────────────────────────────────────────
  VERIFICATION_CHANNEL_ID : "1478508875182379159",
  WELCOME_CHANNEL_ID      : "1478581633228738570",
  LEAVE_CHANNEL_ID        : "1478581751218700339",
  SOO_CHANNEL_ID          : "1478588400260087878",

  // ── Roles ───────────────────────────────────────────────────────────────────
  UNWANTED_ROLE_ID  : "1478548574722855044",
  RECRUIT_ROLE_ID   : "1478522061830881523",

  // Roles permitted to use bot commands
  ALLOWED_ROLE_IDS  : [
    "1478519160706433044", // Founder of OSSI 👑
    "1478519385105895444", // Directorate of Operations ✪
    "1478519645014065212", // Directorate of Analysis 📌
  ],

  // ── Verification ────────────────────────────────────────────────────────────
  FORM_LINK    : "https://docs.google.com/document/d/1dDOZdpQVcfgf3fq8iO3FThOg9R6V2gEMtq3TG6G-Xts/edit?usp=sharing",
  VERIFY_EMOJI : "🔓",

  // ── SOO settings ────────────────────────────────────────────────────────────
  SOO_REMINDER_INTERVAL_MS : 60 * 60 * 1000,   // re-ping unsigned recruits every 1 hour
  SOO_EXPIRY_MS            : 3 * 24 * 60 * 60 * 1000, // kick after 3 days unsigned

  // ── In-memory state ─────────────────────────────────────────────────────────
  state: {
    verificationMessageId : null,
    warnLog               : {}, // { userId: [reason, ...] }

    // SOO tracking
    // sooLog[userId] = {
    //   messageId    : string,   — the SOO embed message ID in the SOO channel
    //   username     : string,   — their Discord username at time of verification
    //   verifiedAt   : number,   — timestamp (ms) when they passed verification
    //   signed       : boolean,
    // }
    sooLog : {},
  },
};
