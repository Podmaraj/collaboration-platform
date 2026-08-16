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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

class PaginationQuery {
  page?: number;
  limit?: number;
}

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /** POST /workspaces — Create a new workspace */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const workspace = await this.workspacesService.create(dto, user.sub);
    return { workspace };
  }

  /** GET /workspaces — List workspaces the user belongs to (paginated) */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQuery,
  ) {
    return this.workspacesService.findAll(user.sub, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 20, 100),
    });
  }

  /** GET /workspaces/:workspaceId */
  @Get(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async findOne(@Param('workspaceId') workspaceId: string) {
    const workspace = await this.workspacesService.findOne(workspaceId);
    return { workspace };
  }

  /** PATCH /workspaces/:workspaceId — OWNER only */
  @Patch(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.OWNER)
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.update(workspaceId, dto);
    return { workspace };
  }

  /** DELETE /workspaces/:workspaceId — OWNER only */
  @Delete(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('workspaceId') workspaceId: string) {
    await this.workspacesService.remove(workspaceId);
  }
}
