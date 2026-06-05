import { SetMetadata } from '@nestjs/common';

import type { MembershipRoleValue, PlatformRoleValue } from '../constants/roles';

export interface RoleOptions {
  membership?: MembershipRoleValue[];
  platform?: PlatformRoleValue[];
}

export const ROLES_KEY = 'roles';
export const Roles = (roles: RoleOptions) => SetMetadata(ROLES_KEY, roles);
