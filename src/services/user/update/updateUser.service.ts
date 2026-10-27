import { User } from "@prisma/client";
import { UpdateUserInput } from "../../../schemas/user/updateUser.schema.js";
import USER_REPO from "../../../database/user/index.repo.js";

export default async function updateUser(
  loggedInUser: User,
  data: UpdateUserInput,
) {
  return await USER_REPO.updateUser(loggedInUser, data);
}
