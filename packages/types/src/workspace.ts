// ─── Workspace Types ─────────────────────────────────────────────────────────

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface WorkspaceDto {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
