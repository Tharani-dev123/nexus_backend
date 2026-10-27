import { Request } from "express";
import { UAParser } from "ua-parser-js";
import { requestContext } from "../context/requestContext.js";

export interface DeviceAndIpInfo {
  ipAddress: string;
  deviceName: string;
}

export function getDeviceInfoAndIp(req?: Request): DeviceAndIpInfo {
  const store = requestContext.getStore();

  // 1. Determine IP Address
  let ipAddress = store?.request_ip;

  if (
    !ipAddress ||
    ipAddress === "0.0.0.0" ||
    ipAddress === "::1" ||
    ipAddress === "::ffff:127.0.0.1"
  ) {
    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        ipAddress = forwarded.split(",")[0].trim();
      } else if (Array.isArray(forwarded) && forwarded.length > 0) {
        ipAddress = forwarded[0];
      } else {
        ipAddress = req.ip || req.socket?.remoteAddress || "127.0.0.1";
      }
    } else {
      ipAddress = "127.0.0.1";
    }
  }

  // Normalize local IPv6 addresses
  if (ipAddress === "::1" || ipAddress === "::ffff:127.0.0.1") {
    ipAddress = "127.0.0.1";
  }

  // 2. Determine Device Name
  let deviceName = "Unknown Device";
  const userAgent =
    req?.headers["user-agent"] || store?.userDeviceDetails?.userAgent;

  const deviceDetails =
    store?.userDeviceDetails ||
    (userAgent ? new UAParser(userAgent).getResult() : null);

  if (deviceDetails) {
    const browserName = deviceDetails.browser?.name;
    const browserVersion = deviceDetails.browser?.version;
    const osName = deviceDetails.os?.name;
    const vendor = (deviceDetails.device as any)?.vendor;
    const model = (deviceDetails.device as any)?.model;

    if (vendor && model) {
      deviceName = `${vendor} ${model}`;
      if (osName) deviceName += ` (${osName})`;
    } else if (osName && browserName) {
      deviceName = `${osName} (${browserName})`;
      if (browserVersion) {
        const majorVersion = browserVersion.split(".")[0];
        deviceName += ` ${majorVersion}`;
      }
    } else if (osName) {
      deviceName = osName;
    } else if (browserName) {
      deviceName = browserName;
    } else if (userAgent) {
      deviceName = userAgent;
    }
  }

  return {
    ipAddress,
    deviceName,
  };
}
