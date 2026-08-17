import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

class PaginationQuery {
  page?: number;
  limit?: number;
}

@Controller('workspaces/:workspaceId/documents')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /** POST /workspaces/:workspaceId/documents — any member can create */
  @Post()
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const document = await this.documentsService.create(
      workspaceId,
      dto,
      user.sub,
    );
    return { document };
  }

  /** GET /workspaces/:workspaceId/documents — paginated list */
  @Get()
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() query: PaginationQuery,
  ) {
    return this.documentsService.findAll(workspaceId, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 20, 100),
    });
  }

  /** GET /workspaces/:workspaceId/documents/:documentId */
  @Get(':documentId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
  ) {
    const document = await this.documentsService.findOne(
      workspaceId,
      documentId,
    );
    return { document };
  }

  /** PATCH /workspaces/:workspaceId/documents/:documentId — OWNER or ADMIN */
  @Patch(':documentId')
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    const document = await this.documentsService.update(
      workspaceId,
      documentId,
      dto,
    );
    return { document };
  }

  /** DELETE /workspaces/:workspaceId/documents/:documentId — creator only */
  @Delete(':documentId')
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.documentsService.remove(workspaceId, documentId, user.sub);
  }
}
