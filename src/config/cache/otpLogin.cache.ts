import Cache from "../../cache/index.js";

/**
 * Holds one-time login codes for passwordless user accounts.
 * Longer-lived than the email-verification/reset caches so a user has time to
 * fetch the code from their inbox and sign in.
 */
const otpLoginCache = new Cache(10 * 60 * 1000);

export default otpLoginCache;
