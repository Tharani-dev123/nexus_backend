import logger from "../config/logging/logger.config.js";
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";

import { errorServerResponse } from "./serverResponse.handler.js";
import { AppError } from "../types/AppError.js";

type PrismaKnownError = Prisma.PrismaClientKnownRequestError;

const firstString = (...values: unknown[]): string | null => {
  for (const v of values)
    if (typeof v === "string" && v.trim()) return v.trim();
  return null;
};

/**
 * Strips DB-internal suffixes so constraint names read naturally.
 * "user_email_key" → "email", "post_authorId_fkey" → "authorId"
 */
const cleanField = (value?: string | null): string | null => {
  if (!value || typeof value !== "string") return null;
  return (
    value
      .replace(/_fkey$/i, "")
      .replace(/_key$/i, "")
      .replace(/_idx$/i, "")
      .replace(/^[^_]+_/, "")
      .replace(/\s*\(index\)\s*$/i, "")
      .trim() || null
  );
};

/**
 * Finds a field/constraint name across every location Prisma uses depending
 * on the driver: meta fields → driver adapter cause → cause string → message.
 */
const extractField = (
  meta: Record<string, unknown> | undefined,
  message?: string,
): string | null => {
  const cause = (meta?.driverAdapterError as any)?.cause;
  const causeMatch = typeof meta?.cause === "string"
    ? meta.cause.match(/field[:\s]+([^\s,`"]+)/i)?.[1]
    : null;
  const msgMatch = message
    ? message.match(/constraint[:`\s]+[`"]([^`"]+)[`"]/i)?.[1]
      ?? message.match(/field[:`\s]+[`"]([^`"]+)[`"]/i)?.[1]
    : null;

  return cleanField(firstString(
    meta?.field_name as string,
    meta?.constraint as string,
    cause?.constraint,
    cause?.column,
    cause?.field,
    causeMatch,
    msgMatch,
  ));
};

/** Builds an errorServerResponse and logs internal-only fields separately. */
const respond = (
  res: Response,
  message: string,
  status: number,
  data: Record<string, unknown>,
  internal?: Record<string, unknown>,
) => {
  if (internal) logger.error(internal);
  return errorServerResponse(res, message, status, data);
};

// ── Per-error handlers ─────────────────────────────────────────────────────

const prismaErrorHandlers: Record<
  string,
  (err: PrismaKnownError, res: Response) => Response
> = {

  // Column: {column_name}
  P2000: (err, res) => {
    const column = cleanField(err.meta?.column_name as string);
    return respond(res,
      column ? `The value for '${column}' is too long.` : "A provided value is too long.",
      400, { code: err.code, column });
  },

  // {model_name}.{argument_name} = {argument_value}
  P2001: (err, res) => {
    const model = firstString(err.meta?.model_name as string);
    const arg   = firstString(err.meta?.argument_name as string);
    const val   = firstString(err.meta?.argument_value as string);
    return respond(res,
      model && arg && val ? `No ${model} found where ${arg} is '${val}'.`
        : model           ? `The requested ${model} was not found.`
                          : "The requested record was not found.",
      404, { code: err.code, model, arg, val });
  },

  // Unique constraint: {constraint}
  P2002: (err, res) => {
    const field = extractField(err.meta, err.message);
    return respond(res,
      field ? `A record with that ${field} already exists.`
            : "A record with those details already exists.",
      409, { code: err.code, field });
  },

  // Foreign key: {field_name}
  P2003: (err, res) => {
    const field = extractField(err.meta, err.message);
    return respond(res,
      field ? `'${field}' refers to a record that does not exist.`
            : "A related record could not be found.",
      400, { code: err.code, field });
  },

  // Internal DB constraint error
  P2004: (err, res) =>
    respond(res, "The request violates a database constraint.", 400,
      { code: err.code }, { database_error: err.meta?.database_error }),

  // Invalid stored value: {field_name}
  P2005: (err, res) => {
    const field = firstString(err.meta?.field_name as string);
    return respond(res,
      field ? `The stored value for '${field}' is invalid. Please contact support.`
            : "A stored value is invalid. Please contact support.",
      500, { code: err.code, field });
  },

  // Invalid provided value: {model_name}.{field_name}
  P2006: (err, res) => {
    const field = firstString(err.meta?.field_name as string);
    const model = firstString(err.meta?.model_name as string);
    return respond(res,
      field && model ? `The value provided for '${field}' on ${model} is not valid.`
        : field      ? `The value provided for '${field}' is not valid.`
                     : "A provided value is not valid.",
      400, { code: err.code, field, model });
  },

  P2007: (err, res) =>
    respond(res, "The data provided failed validation.", 400,
      { code: err.code }, { database_error: err.meta?.database_error }),

  P2008: (err, res) =>
    respond(res, "The query could not be processed. Please contact support.", 500,
      { code: err.code },
      { query_parsing_error: err.meta?.query_parsing_error, query_position: err.meta?.query_position }),

  P2009: (err, res) =>
    respond(res, "The query failed validation. Please contact support.", 500,
      { code: err.code },
      { query_validation_error: err.meta?.query_validation_error, query_position: err.meta?.query_position }),

  P2010: (err, res) =>
    respond(res, "A database query failed. Please try again.", 500,
      { code: err.code },
      { db_code: err.meta?.code, db_message: err.meta?.message }),

  // Null constraint: {constraint}
  P2011: (err, res) => {
    const field = extractField(err.meta, err.message);
    return respond(res,
      field ? `'${field}' is required and cannot be empty.` : "A required field is missing.",
      400, { code: err.code, field });
  },

  // Missing value at: {path}
  P2012: (err, res) => {
    const path = firstString(err.meta?.path as string);
    return respond(res,
      path ? `A required value is missing at '${path}'.` : "A required value is missing.",
      400, { code: err.code, path });
  },

  // Missing argument: {argument_name} for {field_name}
  P2013: (err, res) => {
    const arg   = firstString(err.meta?.argument_name as string);
    const field = firstString(err.meta?.field_name as string);
    return respond(res,
      arg && field ? `'${arg}' is required for '${field}'.`
        : arg      ? `Required argument '${arg}' is missing.`
                   : "A required argument is missing.",
      400, { code: err.code, arg, field });
  },

  // Relation violation: {relation_name} between {model_a} and {model_b}
  P2014: (err, res) => {
    const relation = firstString(err.meta?.relation_name as string);
    const modelA   = firstString(err.meta?.model_a_name as string);
    const modelB   = firstString(err.meta?.model_b_name as string);
    return respond(res,
      modelA && modelB ? `This change would break the required link between ${modelA} and ${modelB}.`
        : relation     ? `This change would violate the required relation '${relation}'.`
                       : "This change would violate a required relation.",
      400, { code: err.code, relation, modelA, modelB });
  },

  P2015: (err, res) =>
    respond(res, "A related record could not be found.", 404,
      { code: err.code }, { details: err.meta?.details }),

  P2016: (err, res) =>
    respond(res, "The query could not be interpreted. Please contact support.", 500,
      { code: err.code }, { details: err.meta?.details }),

  // Disconnected relation: {parent_name} ↔ {child_name}
  P2017: (err, res) => {
    const parent = firstString(err.meta?.parent_name as string);
    const child  = firstString(err.meta?.child_name as string);
    return respond(res,
      parent && child ? `${parent} and ${child} are not linked.`
                      : "The required records are not connected.",
      400, { code: err.code, parent, child });
  },

  P2018: (err, res) =>
    respond(res, "One or more required related records were not found.", 404,
      { code: err.code }, { details: err.meta?.details }),

  P2019: (err, res) =>
    respond(res, "The input provided is invalid.", 400,
      { code: err.code }, { details: err.meta?.details }),

  P2020: (err, res) =>
    respond(res, "A value in the request is out of the allowed range.", 400,
      { code: err.code }, { details: err.meta?.details }),

  P2021: (err, res) =>
    respond(res, "A required database table is missing. Please contact support.", 500,
      { code: err.code }, { table: err.meta?.table }),

  P2022: (err, res) =>
    respond(res, "A required database column is missing. Please contact support.", 500,
      { code: err.code }, { column: err.meta?.column }),

  P2023: (err, res) =>
    respond(res, "The database contains inconsistent data. Please contact support.", 500,
      { code: err.code }, { message: err.meta?.message }),

  P2024: (err, res) =>
    respond(res, "The server is under heavy load. Please wait a moment and try again.", 503,
      { code: err.code },
      { timeout: err.meta?.timeout, connection_limit: err.meta?.connection_limit }),

  // Operation failed: {cause}
  P2025: (err, res) => {
    const cause = firstString(err.meta?.cause as string);
    return respond(res,
      cause ? `Operation failed: ${cause}` : "The requested record was not found.",
      404, { code: err.code, cause });
  },

  P2026: (err, res) =>
    respond(res, "This operation is not supported by the current database. Please contact support.", 500,
      { code: err.code }, { feature: err.meta?.feature }),

  P2027: (err, res) =>
    respond(res, "Multiple database errors occurred. Please try again.", 500,
      { code: err.code }, { errors: err.meta?.errors }),

  P2028: (err, res) =>
    respond(res, "The transaction failed. Please try again.", 500,
      { code: err.code }, { error: err.meta?.error }),

  P2029: (err, res) =>
    respond(res, "The request contains too many parameters.", 400,
      { code: err.code }, { message: err.meta?.message }),

  P2034: (err, res) =>
    respond(res, "A conflict occurred while saving your data. Please try again.", 409,
      { code: err.code }),

  P2035: (err, res) =>
    respond(res, "An unexpected database error occurred. Please contact support.", 500,
      { code: err.code }, { database_error: err.meta?.database_error }),

  P2036: (err, res) =>
    respond(res, "An external connector error occurred. Please contact support.", 500,
      { code: err.code }, { connector_id: err.meta?.id }),

  P2037: (err, res) =>
    respond(res, "Too many database connections are open. Please try again shortly.", 503,
      { code: err.code }, { message: err.meta?.message }),
};

// ── Express middleware ─────────────────────────────────────────────────────

const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  logger.error({ method: req.method, url: req.originalUrl });
  return errorServerResponse(res, `Cannot ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error({ code: err.code, meta: err.meta, message: err.message });
    const handler = prismaErrorHandlers[err.code];
    if (handler) return handler(err, res);
    return errorServerResponse(res, "An unexpected database error occurred.", 500, { code: err.code });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const message = err.message.split("\n").map((v) => v.trim()).filter(Boolean).join(" ");
    logger.error({ message });
    return errorServerResponse(res, "Invalid request data.", 400, { detail: message });
  }

  if (err instanceof MulterError) {
    logger.error({ code: err.code, field: err.field, message: err.message });
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "The uploaded file is too large (max 5MB)."
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field. Send the spreadsheet in the 'file' field."
          : err.message;
    return errorServerResponse(res, message, 400, { code: err.code });
  }

  if (err instanceof AppError) {
    logger.error({ message: err.message, status: err.status, data: err.data });
    return errorServerResponse(res, err.message, err.status || 500, err.data);
  }

  logger.error({ message: err?.message, stack: err?.stack });
  return errorServerResponse(res, err?.message || "Internal server error.", 500);
};

export { notFoundHandler, errorHandler };