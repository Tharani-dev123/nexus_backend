import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/AppError.js";

type ParsedRequest = {
  body: Request["body"];
  query: Request["query"];
  params: Request["params"];
};

const validateInput =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as Partial<ParsedRequest>;

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) {
        Object.assign(req.query as Record<string, unknown>, parsed.query);
      }
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (e: any) {
      throw new AppError(e.message, 400);
    }
  };

export default validateInput;
