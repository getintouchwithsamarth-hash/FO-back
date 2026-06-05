export const membershipRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
export const platformRoles = ['USER', 'SUPER_ADMIN'] as const;

export type MembershipRoleValue = (typeof membershipRoles)[number];
export type PlatformRoleValue = (typeof platformRoles)[number];
