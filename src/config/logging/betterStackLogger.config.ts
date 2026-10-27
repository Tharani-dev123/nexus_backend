import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import LOGGING_CONFIG from "./index.config.js";

const { BETTERSTACK_TOKEN, BETTERSTACK_URL } = LOGGING_CONFIG;

// Tests and local development may not have a Better Stack token. Do not
// initialize Logtail unless logging is configured with a real token.
const BETTERSTACK_LOG_TRANSPORT = BETTERSTACK_TOKEN
  ? new LogtailTransport(
      new Logtail(BETTERSTACK_TOKEN, { endpoint: BETTERSTACK_URL }),
    )
  : undefined;

export default BETTERSTACK_LOG_TRANSPORT;
