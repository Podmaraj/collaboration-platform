import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which workspace roles can access an endpoint.
 * Must be combined with WorkspaceRoleGuard.
 *
 * Usage: @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
 */
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);
