import { Module } from '@nestjs/common';
import { WorkspaceMembersController } from './workspace-members.controller';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [WorkspaceMembersController],
  providers: [
    WorkspaceMembersService,
    WorkspaceMembersRepository,
    WorkspaceRoleGuard,
  ],
  exports: [WorkspaceMembersService, WorkspaceMembersRepository],
})
export class WorkspaceMembersModule {}
