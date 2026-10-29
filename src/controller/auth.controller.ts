import { Request, Response } from "express";
import AUTH_SERVICE from "../services/auth/index.service.js";
import {
  successDataResponse,
  successMessageResponse,
} from "../handlers/serverResponse.handler.js";
import { SignupInput } from "../schemas/auth/signup.schema.js";
import { LoginInput } from "../schemas/auth/login.schema.js";
import USER_SERVICE from "../services/user/index.service.js";
import { ForgotPasswordInput } from "../schemas/auth/forgotPassword.schema.js";
import { VerifyEmailConfirmInput } from "../schemas/auth/verifyEmail.schema.js";
import { SendVerificationEmailInput } from "../schemas/auth/sendVerificationEmail.schema.js";
import { ResetPasswordInput } from "../schemas/auth/resetPassword.schema.js";
import { RequestLoginOtpInput } from "../schemas/auth/requestLoginOtp.schema.js";
import { VerifyLoginOtpInput } from "../schemas/auth/verifyLoginOtp.schema.js";
import { AcceptUserInviteInput } from "../schemas/auth/acceptUserInvite.schema.js";
import USER_INVITE_SERVICE from "../services/userInvite/index.service.js";
import { completeStudentSetup, requestStudentSetup } from "../services/student/studentOnboarding.service.js";

async function registerHandler(req: Request, res: Response) {
  const data = req.body as SignupInput;
  const { user, accessToken } = await AUTH_SERVICE.signUpNewUserByEmail(data);
  return successDataResponse(res, { user, accessToken }, 201);
}

async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;
  const result = await AUTH_SERVICE.loginByEmail(email, password, req);

  return successDataResponse(res, result, 200);
}

async function sendVerificationEmail(req: Request, res: Response) {
  const { email } = req.body as SendVerificationEmailInput;
  await USER_SERVICE.VERIFICATION.sendVerificaitonEmail(email, req.ip ?? "unknown");
  return successMessageResponse(res, "Verification email sent", 200);
}

async function logoutHandler(req: Request, res: Response) {
  const auth = req.auth;

  if (!auth) return successMessageResponse(res, "Logged out successfully", 200);

  await AUTH_SERVICE.logoutSingleDevice(auth.rftoken_id);

  return successMessageResponse(res, "Logged out successfully", 200);
}

async function verifyEmail(req: Request, res: Response) {
  const { email, otp } = req.body as VerifyEmailConfirmInput;

  await USER_SERVICE.VERIFICATION.verifyEmail(email, otp, req.ip ?? "unknown");

  return successMessageResponse(res, "Email verified", 200);
}

async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as ForgotPasswordInput;

  await AUTH_SERVICE.forgotPassword(email, req.ip ?? "unknown");

  return successMessageResponse(res, "Reset password email sent", 200);
}

async function resetPassword(req: Request, res: Response) {
  const { email, otp, newPassword } = req.body as ResetPasswordInput;

  await AUTH_SERVICE.resetPassword(email, otp, newPassword, req.ip ?? "unknown");

  return successMessageResponse(res, "Password reset successful", 200);
}


async function requestLoginOtp(req: Request, res: Response) {
  const { email } = req.body as RequestLoginOtpInput;

  await AUTH_SERVICE.requestLoginOtp(email, req.ip ?? "unknown");

  return successMessageResponse(res, "Login code sent", 200);
}

async function verifyLoginOtp(req: Request, res: Response) {
  const { email, otp } = req.body as VerifyLoginOtpInput;

  const result = await AUTH_SERVICE.verifyLoginOtp(email, otp, req);

  return successDataResponse(res, result, 200);
}

async function acceptUserInvite(req: Request, res: Response) {
  const { token, password } = req.body as AcceptUserInviteInput;

  const result = await USER_INVITE_SERVICE.acceptUserInvite(token, password, req);

  return successDataResponse(res, result, 200);
}

async function requestStudentSetupHandler(req: Request, res: Response) {
  await requestStudentSetup(req.body.email, req.ip ?? "unknown");
  return successMessageResponse(res, "If the account needs setup, a code has been sent", 200);
}

async function completeStudentSetupHandler(req: Request, res: Response) {
  const { email, otp, password } = req.body;
  const result = await completeStudentSetup(email, otp, password, req.ip ?? "unknown");
  return successDataResponse(res, result, 200);
}

async function getNewAccessToken(req: Request, res: Response) {
  const refreshToken = req.body.refreshToken;

  const accessToken =
    await AUTH_SERVICE.ACCESS_TOKEN.refreshAccessToken(refreshToken);

  return successDataResponse(res, { accessToken }, 200);
}

async function logoutAllDevice(req: Request, res: Response) {
  const user = req.user;

  await AUTH_SERVICE.logoutAllDevice(user.id);

  return successMessageResponse(
    res,
    "Logged out of all devices successfully",
    200,
  );
}

const AUTH_CONTROLLER = {
  registerHandler,
  loginHandler,
  sendVerificationEmail,
  logoutHandler,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestLoginOtp,
  verifyLoginOtp,
  acceptUserInvite,
  requestStudentSetupHandler,
  completeStudentSetupHandler,
  getNewAccessToken,
  logoutAllDevice,
};

export default AUTH_CONTROLLER;
