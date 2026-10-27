import { Request, Response } from "express";
import USER_SERVICE from "../services/user/index.service.js";
import {
  successDataResponse,
  successMessageResponse,
} from "../handlers/serverResponse.handler.js";
import { ChangePasswordInput } from "../schemas/user/changePassword.schema.js";
import { UpdateUserInput } from "../schemas/user/updateUser.schema.js";
import { DeleteUserInput } from "../schemas/user/deleteUser.schema.js";
import { RevokeSessionInput } from "../schemas/user/revokeSession.schema.js";

const getUser = async (req: Request, res: Response) => {
  const user = await USER_SERVICE.getUserById(req.user.id);
  return successDataResponse(res, user, 200);
};

const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;

  await USER_SERVICE.changePassword(req.user.id, currentPassword, newPassword);
  return successDataResponse(res, { message: "Password updated" }, 200);
};

const deleteUser = async (req: Request, res: Response) => {
  const { password } = req.body as DeleteUserInput;
  await USER_SERVICE.deleteUser(req.user, password);
  return successDataResponse(res, { message: "User deleted" }, 200);
};

const updateUser = async (req: Request, res: Response) => {
  const data = req.body as UpdateUserInput;
  const updatedUser = await USER_SERVICE.updateUser(req.user, data);
  return successDataResponse(res, updatedUser, 200);
};

const getActiveSessions = async (req: Request, res: Response) => {
  const user = req.user;

  const sessions = await USER_SERVICE.getActiveUserSessions(user);
  return successDataResponse(res, sessions, 200);
};

const revokeSession = async (req: Request, res: Response) => {
  const { sessionId } = req.body as RevokeSessionInput;

  await USER_SERVICE.revokeSession(sessionId);

  return successMessageResponse(res, "Session Revoked Successfully", 200);
};
const USER_CONTROLLER = {
  getUser,
  changePassword,
  deleteUser,
  updateUser,
  getActiveSessions,
  revokeSession,
};

export default USER_CONTROLLER;
