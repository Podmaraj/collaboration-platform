import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { WorkspaceMember, WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspaceMembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string): Promise<(WorkspaceMember & { user: { id: string; name: string; email: string } })[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async create(data: { workspaceId: string; userId: string; role: WorkspaceRole }): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.create({ data });
  }

  async updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }
}
