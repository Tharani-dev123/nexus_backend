import { Router } from "express";
import validateInput from "../middleware/inputValidator.middleware.js";
import AUTH_CONTROLLER from "../controller/auth.controller.js";
import AUTH_SCHEMAS from "../schemas/auth/index.schema.js";
import authenticateUser from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post(
  "/signup",
  validateInput(AUTH_SCHEMAS.signup),
  AUTH_CONTROLLER.registerHandler,
);
authRouter.post(
  "/login",
  validateInput(AUTH_SCHEMAS.login),
  AUTH_CONTROLLER.loginHandler,
);

authRouter.post("/logout", authenticateUser, AUTH_CONTROLLER.logoutHandler);
authRouter.post(
  "/send-verification-email",
  validateInput(AUTH_SCHEMAS.sendVerificationEmail),
  AUTH_CONTROLLER.sendVerificationEmail,
);

authRouter.post(
  "/verify-email",
  validateInput(AUTH_SCHEMAS.verifyEmail),
  AUTH_CONTROLLER.verifyEmail,
);

authRouter.post(
  "/forgot-password",
  validateInput(AUTH_SCHEMAS.forgotPassword),
  AUTH_CONTROLLER.forgotPassword,
);

authRouter.post(
  "/reset-password",
  validateInput(AUTH_SCHEMAS.resetPassword),
  AUTH_CONTROLLER.resetPassword,
);

authRouter.post(
  "/request-login-otp",
  validateInput(AUTH_SCHEMAS.requestLoginOtp),
  AUTH_CONTROLLER.requestLoginOtp,
);

authRouter.post(
  "/verify-login-otp",
  validateInput(AUTH_SCHEMAS.verifyLoginOtp),
  AUTH_CONTROLLER.verifyLoginOtp,
);

authRouter.post(
  "/accept-user-invite",
  validateInput(AUTH_SCHEMAS.acceptUserInvite),
  AUTH_CONTROLLER.acceptUserInvite,
);

authRouter.post(
  "/refresh-access-token",
  validateInput(AUTH_SCHEMAS.refreshAccessToken),
  AUTH_CONTROLLER.getNewAccessToken,
);

authRouter.post(
  "/logout-all-devices",
  authenticateUser,
  AUTH_CONTROLLER.logoutAllDevice,
);

export default authRouter;
