import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { WorkspaceMembersService } from './workspace-members.service';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class WorkspaceMembersController {
  constructor(private readonly membersService: WorkspaceMembersService) {}

  /** GET /workspaces/:workspaceId/members */
  @Get()
  @Roles(WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async findAll(@Param('workspaceId') workspaceId: string) {
    const members = await this.membersService.findAll(workspaceId);
    return { members };
  }

  /** POST /workspaces/:workspaceId/members — OWNER or ADMIN */
  @Post()
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const member = await this.membersService.addMember(workspaceId, dto, user.sub);
    return { member };
  }

  /** PATCH /workspaces/:workspaceId/members/:userId */
  @Patch(':userId')
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async updateRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: FastifyRequest & { workspaceMember: { role: WorkspaceRole } },
  ) {
    const member = await this.membersService.updateRole(
      workspaceId,
      userId,
      dto,
      req.workspaceMember.role,
    );
    return { member };
  }

  /** DELETE /workspaces/:workspaceId/members/:userId — OWNER or ADMIN */
  @Delete(':userId')
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.membersService.removeMember(workspaceId, userId, user.sub);
  }
}
