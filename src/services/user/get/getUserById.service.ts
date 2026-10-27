import { AppError } from "../../../types/AppError.js";
import USER_REPO from "../../../database/user/index.repo.js";

export default async function getUserById(userId: string) {
  const user = await USER_REPO.getUserById(userId);
  if (!user) throw new AppError("Unauthorized", 401);
  return user;
}
