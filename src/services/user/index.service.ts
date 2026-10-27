import getUserById from "./get/getUserById.service.js";
import getUserByEmail from "./get/getUserByEmail.service.js";
import { changePassword } from "./update/changePassword.service.js";
import sendVerificaitonEmail from "./send/sendVerificationEmail.service.js";
import verifyEmailService from "./update/verifyEmail.service.js";
import deleteUser from "./update/deleteUser.service.js";
import updateUser from "./update/updateUser.service.js";
import getActiveUserSessions from "./get/getActiveUserSessions.service.js";
import revokeSession from "./update/revokeSession.service.js";

const USER_SERVICE = {
  getUserById,
  getUserByEmail,
  changePassword,
  deleteUser,
  updateUser,
  getActiveUserSessions,
  revokeSession,
  VERIFICATION: {
    sendVerificaitonEmail,
    verifyEmail: verifyEmailService,
  },
};

export default USER_SERVICE;
