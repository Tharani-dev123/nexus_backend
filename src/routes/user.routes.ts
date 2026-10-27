import { Router } from "express";
import USER_CONTROLLER from "../controller/user.controller.js";
import validateInput from "../middleware/inputValidator.middleware.js";
import USER_SCHEMAS from "../schemas/user/index.schema.js";

const userRouter = Router();

userRouter.get("/me", USER_CONTROLLER.getUser);

userRouter.post(
  "/change-password",
  validateInput(USER_SCHEMAS.changePassword),
  USER_CONTROLLER.changePassword,
);

userRouter.put(
  "/update-me",
  validateInput(USER_SCHEMAS.updateUser),
  USER_CONTROLLER.updateUser,
);

userRouter.delete(
  "/delete-me",
  validateInput(USER_SCHEMAS.deleteUser),
  USER_CONTROLLER.deleteUser,
);

userRouter.get("/get-active-sessions", USER_CONTROLLER.getActiveSessions);

userRouter.post(
  "/revoke-session",
  validateInput(USER_SCHEMAS.revokeSession),
  USER_CONTROLLER.revokeSession,
);

export default userRouter;
