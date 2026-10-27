import findUserByEmail from "./get/getUserByEmail.repo.js";
import findSafeUserById from "./get/getUserById.repo.js";
import findUserWithCredentialByEmail from "./get/getUserWithCredentialByEmail.repo.js";
import findUserWithCredentialById from "./get/getUserWithCredentialById.repo.js";
import findEmailsInUse from "./get/getEmailsInUse.repo.js";
import createUserWithCredential from "./create/createUserWithCredential.repo.js";
import verifyEmailRepo from "./update/verifyEmail.repo.js";
import deleteUserRepo from "./update/deleteUser.repo.js";
import updateUserRepo from "./update/updateUser.repo.js";

const USER_REPO = {
  getUserByEmail: findUserByEmail,
  getUserById: findSafeUserById,
  getUserWithCredentialByEmail: findUserWithCredentialByEmail,
  getUserWithCredentialById: findUserWithCredentialById,
  getEmailsInUse: findEmailsInUse,
  createUserWithCredential,
  verifyEmail: verifyEmailRepo,
  deleteUser: deleteUserRepo,
  updateUser: updateUserRepo,
};

export default USER_REPO;
