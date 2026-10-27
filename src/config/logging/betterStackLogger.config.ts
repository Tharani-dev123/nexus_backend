import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import LOGGING_CONFIG from "./index.config.js";

const { BETTERSTACK_TOKEN, BETTERSTACK_URL } = LOGGING_CONFIG;

export const logtail = new Logtail(BETTERSTACK_TOKEN as string, {
  endpoint: BETTERSTACK_URL,
});

const BETTERSTACK_LOG_TRANSPORT = new LogtailTransport(logtail);

export default BETTERSTACK_LOG_TRANSPORT;
