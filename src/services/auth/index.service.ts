import { signUpNewUserByEmail } from "./email/signUpByEmail.service.js";
import {
  hashPassword,
  verifyPassword,
} from "./password/hashPassword.service.js";

import { loginByEmail } from "./email/loginInByEmail.service.js";
import ACCESS_TOKEN_SERVICE from "./token/accessToken.service.js";
import validateUserPassword from "./password/validateUserPassword.service.js";
import generateOtp from "./OTP/generateOtp.service.js";
import forgotPasswordService from "./email/forgotPassword.service.js";
import resetPasswordService from "./email/resetPassword.service.js";
import logoutSingleDeviceService from "./email/logoutSingleDevice.service.js";
import REFRESH_TOKEN_SERVICE from "./token/refreshToken/index.service.js";
import logoutAllDevice from "./email/logoutAllDevice.service.js";
import requestLoginOtp from "./email/requestLoginOtp.service.js";
import verifyLoginOtp from "./email/verifyLoginOtp.service.js";

const AUTH_SERVICE = {
  PASSWORD: {
    hashPassword,
    verifyPassword,
    validateUserPassword,
  },
  ACCESS_TOKEN: { ...ACCESS_TOKEN_SERVICE },
  REFRESH_TOKEN: { ...REFRESH_TOKEN_SERVICE },
  OTP: { generateOtp },
  forgotPassword: forgotPasswordService,
  resetPassword: resetPasswordService,
  signUpNewUserByEmail,
  loginByEmail,
  logoutSingleDevice: logoutSingleDeviceService,
  logoutAllDevice,
  requestLoginOtp,
  verifyLoginOtp,
};

export default AUTH_SERVICE;
