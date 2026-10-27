import { ProductModule, UserRole } from "@prisma/client";

export interface NavPermission {
  resource: string;
  action: string;
}

export interface NavItem {
  /** Stable key for the frontend (routing / active-state). */
  key: string;
  label: string;
  /** Client route path. */
  path: string;
  icon: string;
  /** Roles allowed to see + reach this item. If omitted, visible to all authenticated roles. */
  allowedRoles?: UserRole[];
  /** Optional resource-action permission required for this item. */
  permission?: NavPermission;
  /** Optional module associated with this item. */
  module?: ProductModule;
}

export interface NavSection {
  module: ProductModule;
  label: string;
  icon: string;
  items: NavItem[];
}

/** Always rendered for any authenticated company member, regardless of plan. */
export const BASE_NAVIGATION: NavItem[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "dashboard" },
];

/** Core company management pages. Visibility is still controlled by backend RBAC. */
export const MANAGEMENT_NAVIGATION: NavItem[] = [
  {
    key: "company",
    label: "Company",
    path: "/company",
    icon: "building",
    allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN"],
  },
  {
    key: "departments",
    label: "Departments",
    path: "/departments",
    icon: "MdAccountTree",
    allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN"],
  },
];

/** Workspace / account pages. Visibility should still respect RBAC. */
export const WORKSPACE_NAVIGATION: NavItem[] = [
  {
    key: "profile",
    label: "Profile",
    path: "/profile",
    icon: "user",
  },
  {
    key: "subscription",
    label: "Subscription",
    path: "/subscription",
    icon: "MdWorkspacePremium",
    allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "billing",
    label: "Billing",
    path: "/billing",
    icon: "wallet",
    allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "invoices",
    label: "Invoices",
    path: "/invoices",
    icon: "receipt",
    allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "security",
    label: "Security",
    path: "/security",
    icon: "shield",
  },
  {
    key: "sessions",
    label: "Sessions",
    path: "/sessions",
    icon: "MdDevices",
  },
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    icon: "MdSettings",
    allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN"],
  },
  {
    key: "notifications",
    label: "Notifications",
    path: "/notifications",
    icon: "MdNotifications",
  },
  {
    key: "help",
    label: "Help",
    path: "/help",
    icon: "MdHelp",
  },
];

export const MODULE_NAVIGATION: Record<ProductModule, NavSection> = {
  COMPLIANCE: {
    module: "COMPLIANCE",
    label: "Compliance",
    icon: "gavel",
    items: [
      { key: "compliance", label: "Statutory", path: "/compliance", icon: "gavel", allowedRoles: ["OWNER", "SUPER_ADMIN", "COMPANY_ADMIN", "ADMIN"] },
    ],
  },
};
