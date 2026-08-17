import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository, WorkspaceRoleGuard],
  exports: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
