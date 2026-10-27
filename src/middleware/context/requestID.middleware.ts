import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

function requestIdAssigner(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.header("x-request-id");
  const requestId = incomingId || randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}

export default requestIdAssigner;
