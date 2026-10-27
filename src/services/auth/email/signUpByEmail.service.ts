import { AppError } from "../../../types/AppError.js";
import USER_REPO from "../../../database/user/index.repo.js";
import { SignupInput } from "../../../schemas/auth/signup.schema.js";
import AUTH_SERVICE from "../index.service.js";

export async function signUpNewUserByEmail(data: SignupInput) {
  const existing = await USER_REPO.getUserByEmail(data.email);

  if (existing) throw new AppError("Email already in use", 409);

  const passwordHash = await AUTH_SERVICE.PASSWORD.hashPassword(data.password);
  const user = await USER_REPO.createUserWithCredential(data, passwordHash);

  const accessToken = AUTH_SERVICE.ACCESS_TOKEN.generateAccessToken({
    user_id: user.id,
    rftoken_id: "", // Not used for now
  });

  return {
    user,
    accessToken,
  };
}
