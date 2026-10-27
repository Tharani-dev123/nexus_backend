import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../types/AppError.js";
import { SUPER_ROLES } from "../../constants/rbac/permissions.constant.js";

/**
 * Role gate. `authorizeRoles(UserRole.HR, UserRole.ADMIN)` passes when the
 * authenticated user holds one of the listed roles. OWNER / SUPER_ADMIN always
 * pass. Mount after `authenticateUser`.
 */
export default function authorizeRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);

    if (SUPER_ROLES.includes(user.userRole) || roles.includes(user.userRole)) {
      return next();
    }

    throw new AppError("Forbidden: insufficient role for this action", 403);
  };
}
