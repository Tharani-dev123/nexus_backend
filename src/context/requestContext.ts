import { AsyncLocalStorage } from "node:async_hooks";
import UAParser from "ua-parser-js";

interface REQUEST_CONTEXT {
  userDeviceDetails?: {
    browser: UAParser.IBrowser;
    os: UAParser.IOS;
    device: UAParser.IDevice;
    cpu: UAParser.ICPU;
    userAgent: string | undefined;
  };
  request_id: string;
  user_id?: string;
  company_id?: string;
  request_ip: string;
}

export const requestContext = new AsyncLocalStorage<REQUEST_CONTEXT>();
