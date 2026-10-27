import { changePasswordSchema } from "./changePassword.schema.js";
import { updateUserSchema } from "./updateUser.schema.js";
import { deleteUserSchema } from "./deleteUser.schema.js";
import { revokeSessionSchema } from "./revokeSession.schema.js";
const USER_SCHEMAS = {
  changePassword: changePasswordSchema,
  deleteUser: deleteUserSchema,
  updateUser: updateUserSchema,
  revokeSession: revokeSessionSchema,
};

export default USER_SCHEMAS;
