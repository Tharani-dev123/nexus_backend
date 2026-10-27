import { SESv2Client } from "@aws-sdk/client-sesv2";

import AWS_CONFIG from "./aws.config.js";

import getConfigValue from "../index.config.js";

const SES_CLIENT = new SESv2Client(AWS_CONFIG);

export const TRANSACTIONAL_DOMAIN_EMAIL = getConfigValue(
  "TRANSACTIONAL_DOMAIN_EMAIL",
  "",
);

export default SES_CLIENT;
