import Cache from "../../cache/index.js";

const forgotPasswordCache = new Cache(5 * 60 * 1000);

export default forgotPasswordCache;
