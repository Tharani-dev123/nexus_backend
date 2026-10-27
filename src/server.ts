import express from "express";
import type { RequestHandler } from "express";
import helmetDefault, { type HelmetOptions } from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

// helmet's package.json "exports" map declares no "types" condition, so some
// toolchains resolve its CommonJS declarations (index.d.cts) from this ESM file
// and type the default import as the module namespace instead of the callable.
// Pinning the call signature keeps the build independent of that resolution.
const helmet = helmetDefault as unknown as (
  options?: Readonly<HelmetOptions>,
) => RequestHandler;

import reqLogger from "./config/logging/reqLogger.config.js";

import requestIdAssigner from "./middleware/context/requestID.middleware.js";
import setRequestContext from "./middleware/context/requestContext.middleware.js";

import { errorHandler, notFoundHandler } from "./handlers/errors.handler.js";

import indexRouter from "./routes/index.routes.js";
import SERVICE_CONFIG from "./config/service.config.js";
import RequestDeviceInfoParser from "./middleware/context/requestDeviceInfo.middleware.js";

export const app = express();

app.set("trust proxy", SERVICE_CONFIG.TRUST_PROXY);

app.use(helmet());
app.use(
  cors({
    origin: SERVICE_CONFIG.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(requestIdAssigner);
app.use(setRequestContext);
app.use(RequestDeviceInfoParser);
app.use(reqLogger);
app.use(cookieParser());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api", indexRouter);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
