import { Request, Response, NextFunction } from "express";
import { AppError } from "../../types/AppError.js";
import {
  Action,
  Resource,
  hasPermission,
} from "../../constants/rbac/permissions.constant.js";

/**
 * Fine-grained permission gate driven by the RBAC matrix.
 * `requirePermission(RESOURCE.REPORTS, ACTION.READ)`. Mount after `authenticateUser`.
 */
export default function requirePermission(resource: Resource, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);

    if (!hasPermission(user.userRole, resource, action)) {
      throw new AppError(
        `Forbidden: your role (${user.userRole}) cannot ${action} ${resource}`,
        403,
      );
    }

    return next();
  };
}
