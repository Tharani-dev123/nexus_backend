import createUserInvite from "./createUserInvite.repo.js";
import getUserInviteByTokenHash from "./getUserInviteByTokenHash.repo.js";
import acceptUserInvite from "./acceptUserInvite.repo.js";

const USER_INVITE_REPO = {
  createUserInvite,
  getUserInviteByTokenHash,
  acceptUserInvite,
};

export default USER_INVITE_REPO;
