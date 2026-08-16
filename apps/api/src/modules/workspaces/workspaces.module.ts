import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesRepository } from './workspaces.repository';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspacesRepository, WorkspaceRoleGuard],
  exports: [WorkspacesService, WorkspacesRepository],
})
export class WorkspacesModule {}
