import USER_REPO from "../../../database/user/index.repo.js";
import { AppError } from "../../../types/AppError.js";

export default async function getUserByEmail(email: string) {
  // Check if user exists with the email
  const user = await USER_REPO.getUserByEmail(email);
  if (!user) {
    throw new AppError("User with the provided email does not exist.", 404);
  }
  return user;
}
