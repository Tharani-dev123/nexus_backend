import { loginSchema } from "./login.schema.js";
import { signupSchema } from "./signup.schema.js";
import { verifyEmailConfirmSchema } from "./verifyEmail.schema.js";
import { forgotPasswordSchema } from "./forgotPassword.schema.js";
import { resetPasswordSchema } from "./resetPassword.schema.js";
import { sendVerificationEmailSchema } from "./sendVerificationEmail.schema.js";
import { RefreshAccessTokenInputSchema } from "./refreshAccesToken.schema.js";
import { requestLoginOtpSchema } from "./requestLoginOtp.schema.js";
import { verifyLoginOtpSchema } from "./verifyLoginOtp.schema.js";
import { acceptUserInviteSchema } from "./acceptUserInvite.schema.js";

const AUTH_SCHEMAS = {
  signup: signupSchema,
  login: loginSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  verifyEmail: verifyEmailConfirmSchema,
  sendVerificationEmail: sendVerificationEmailSchema,
  refreshAccessToken: RefreshAccessTokenInputSchema,
  requestLoginOtp: requestLoginOtpSchema,
  verifyLoginOtp: verifyLoginOtpSchema,
  acceptUserInvite: acceptUserInviteSchema,
};

export default AUTH_SCHEMAS;
