// ─── Document Types ──────────────────────────────────────────────────────────

export interface DocumentDto {
  id: string;
  workspaceId: string;
  title: string;
  content: Record<string, unknown> | string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}
