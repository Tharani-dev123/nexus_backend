import { Request, Response, NextFunction } from "express";
import { requestContext } from "../../context/requestContext.js";

const setRequestContext = (req: Request, res: Response, next: NextFunction) => {
  requestContext.run(
    { request_id: req.requestId, request_ip: req.ip || "0.0.0.0" },
    () => next(),
  );
};

export default setRequestContext;
