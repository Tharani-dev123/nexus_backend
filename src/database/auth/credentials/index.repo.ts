import updateUserPasswordHash from "./updatePassword.repo.js";

const USER_CREDENTIALS_REPO = {
  PASSWORD: {
    update: updateUserPasswordHash,
  },
};

export default USER_CREDENTIALS_REPO;
