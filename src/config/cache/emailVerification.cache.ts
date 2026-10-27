import Cache from "../../cache/index.js";

const emailVerificationCache = new Cache(5 * 60 * 1000);

export default emailVerificationCache;
