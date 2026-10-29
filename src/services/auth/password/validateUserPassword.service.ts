import USER_REPO from "../../../database/user/index.repo.js";
import AUTH_SERVICE from "../index.service.js";
import { AppError } from "../../../types/AppError.js";
export default async function validateUserPassword(
  email: string,
  password: string,
) {
  const user = await USER_REPO.getUserWithCredentialByEmail(email);
  if (!user || !user.credential) {
    throw new AppError("User not found", 404);
  }
  if (user.userRole === "STUDENT" && user.studentProfile?.status !== "ACTIVE") {
    throw new AppError("Student account is not active", 403);
  }
  if (
    !(await AUTH_SERVICE.PASSWORD.verifyPassword(
      password,
      user.credential.passwordHash,
    ))
  )
    throw new AppError("Invalid password", 401);

  return user;
}
