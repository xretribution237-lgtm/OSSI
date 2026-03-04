module.exports = {
  VERIFICATION_CHANNEL_ID : "1478508875182379159",
  UNWANTED_ROLE_ID        : "1478548574722855044",
  RECRUIT_ROLE_ID         : "1478522061830881523",

  FORM_LINK    : "https://docs.google.com/document/d/1dDOZdpQVcfgf3fq8iO3FThOg9R6V2gEMtq3TG6G-Xts/edit?usp=sharing",
  VERIFY_EMOJI : "🔓",

  // In-memory store for the active verification message
  // (persists as long as the process is running)
  state: {
    verificationMessageId: null,
    // warn log: { userId: [reason, ...] }
    warnLog: {},
  },
};
