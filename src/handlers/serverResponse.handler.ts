/**
 * Sends an error response with a customizable message and status code.
 *
 * @param {Object} res - Express response object.
 * @param {string} [errorMessage="Internal Server Error"] - Error message to send.
 * @param {number} [statusCode=400] - HTTP status code for the error response.
 * @returns {Object} - JSON response with error details.
 */

import { Response } from "express";

const errorServerResponse = (
  res: Response,
  errorMessage = "Internal Server Error",
  statusCode = 500,
  data: object = {}
) => {
  return res
    .status(statusCode || 500)
    .json({ error: { message: errorMessage, ...data }, success: false });
};

/**
 * Sends a success response with a message and optional status code.
 *
 * @param {Object} res - Express response object.
 * @param {string} message - Success message to send.
 * @param {number} [statusCode=200] - HTTP status code for the success response.
 * @returns {Object} - JSON response with success message.
 */
const successMessageResponse = (
  res: Response,
  message: string,
  statusCode = 200
) => {
  return res.status(statusCode || 200).json({ message, success: true });
};

/**
 * Sends a success response with data and optional status code.
 *
 * @param {Object} res - Express response object.
 * @param {Object} data - Data payload to send in the response.
 * @param {number} [statusCode=200] - HTTP status code for the success response.
 * @returns {Object} - JSON response with data payload.
 */
const successDataResponse = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode || 200).json({ data, success: true });
};

export { errorServerResponse, successMessageResponse, successDataResponse };
