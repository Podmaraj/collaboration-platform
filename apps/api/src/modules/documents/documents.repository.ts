import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Document } from '@prisma/client';
import { PaginationOptions } from '../../../common/utils/pagination.util';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    title: string;
    content?: Record<string, unknown>;
    createdBy: string;
  }): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  async findAllByWorkspace(
    workspaceId: string,
    options: PaginationOptions,
  ): Promise<[Document[], number]> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    return this.prisma.$transaction([
      this.prisma.document.findMany({
        where: { workspaceId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.document.count({ where: { workspaceId } }),
    ]);
  }

  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: { title?: string; content?: Record<string, unknown> },
  ): Promise<Document> {
    return this.prisma.document.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({ where: { id } });
  }
}
