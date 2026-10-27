import { ProductModule, UserRole } from "@prisma/client";
import {
  BASE_NAVIGATION,
  MANAGEMENT_NAVIGATION,
  WORKSPACE_NAVIGATION,
  MODULE_NAVIGATION,
  NavSection,
  NavItem,
} from "../../../constants/subscription/navigation.constant.js";
import { hasPermission } from "../../../constants/rbac/permissions.constant.js";
import getEnabledModules from "../module/getEnabledModules.service.js";

export interface Navigation {
  base: NavItem[];
  management: NavItem[];
  sections: NavSection[];
  workspace: NavItem[];
}

/**
 * Filters navigation items by checking both role allowances and resource-action permission gates.
 */
function filterByAccess(items: NavItem[], userRole?: UserRole): NavItem[] {
  if (!userRole) return items;
  return items.filter((item) => {
    // 1. Check role restriction if specified
    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
      return false;
    }
    // 2. Check permission restriction if specified
    if (item.permission) {
      if (!hasPermission(userRole, item.permission.resource as any, item.permission.action as any)) {
        return false;
      }
    }
    return true;
  });
}

export function buildBaseNavigation(userRole?: UserRole): NavItem[] {
  return filterByAccess(BASE_NAVIGATION, userRole);
}

export function buildManagementNavigation(userRole?: UserRole): NavItem[] {
  return filterByAccess(MANAGEMENT_NAVIGATION, userRole);
}

export function buildWorkspaceNavigation(userRole?: UserRole): NavItem[] {
  return filterByAccess(WORKSPACE_NAVIGATION, userRole);
}

export function buildModuleNavigation(
  enabledModules: readonly ProductModule[],
  userRole?: UserRole,
): NavSection[] {
  const enabled = new Set(enabledModules);

  return (Object.keys(MODULE_NAVIGATION) as ProductModule[])
    .filter((module) => enabled.has(module))
    .map((module) => {
      const section = MODULE_NAVIGATION[module];
      return {
        ...section,
        items: filterByAccess(section.items, userRole),
      };
    })
    .filter((section) => section.items.length > 0);
}

/**
 * Builds the sidebar navigation payload from the user's role, company subscription, and enabled modules.
 * Can be overridden with specific enabled modules for tests/graceful fallbacks.
 */
export default async function buildNavigation(
  user: { userRole: UserRole } | null | undefined,
  company: { id: string } | null | undefined,
  subscription: { isActive: boolean } | null | undefined,
  overrideEnabledModules?: ProductModule[],
): Promise<Navigation> {
  const userRole = user?.userRole;

  let enabledModules: ProductModule[] = [];
  if (overrideEnabledModules) {
    enabledModules = overrideEnabledModules;
  } else if (company && subscription?.isActive) {
    enabledModules = await getEnabledModules(company.id);
  }

  return {
    base: buildBaseNavigation(userRole),
    management: buildManagementNavigation(userRole),
    sections: buildModuleNavigation(enabledModules, userRole),
    workspace: buildWorkspaceNavigation(userRole),
  };
}
