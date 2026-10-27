import { User } from "@prisma/client";
import AUTH_SERVICE from "../../auth/index.service.js";
import USER_REPO from "../../../database/user/index.repo.js";

export default async function deleteUser(user: User, password: string) {
  await AUTH_SERVICE.PASSWORD.validateUserPassword(user.email, password);

  const deleteUser = await USER_REPO.deleteUser(user);

  return deleteUser;
}
