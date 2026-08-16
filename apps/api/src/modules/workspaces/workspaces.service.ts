import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkspacesRepository } from './workspaces.repository';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
import { paginate, PaginatedResult, PaginationOptions } from '../../common/utils/pagination.util';
import { Workspace } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly workspacesRepository: WorkspacesRepository) {}

  async create(dto: CreateWorkspaceDto, ownerId: string): Promise<Workspace> {
    return this.workspacesRepository.create({ name: dto.name, ownerId });
  }

  async findAll(userId: string, options: PaginationOptions): Promise<PaginatedResult<Workspace>> {
    const [items, total] = await this.workspacesRepository.findAllByUser(userId, options);
    return paginate(items, total, options);
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.workspacesRepository.findById(id);
    if (!workspace) {
      throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' });
    }
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    await this.findOne(id);
    return this.workspacesRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.workspacesRepository.delete(id);
  }
}
