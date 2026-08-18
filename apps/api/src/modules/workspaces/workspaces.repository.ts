import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Workspace, WorkspaceRole } from '@prisma/client';
import { PaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; ownerId: string }): Promise<Workspace> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const workspace = await tx.workspace.create({ data });
      // Automatically add the creator as OWNER member
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: data.ownerId,
          role: WorkspaceRole.OWNER,
        },
      });
      return workspace;
    });
  }

  async findAllByUser(
    userId: string,
    options: PaginationOptions,
  ): Promise<[Workspace[], number]> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workspace.findMany({
        where: { members: { some: { userId } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workspace.count({
        where: { members: { some: { userId } } },
      }),
    ]);

    return [items, total];
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string }): Promise<Workspace> {
    return this.prisma.workspace.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workspace.delete({ where: { id } });
  }
}
