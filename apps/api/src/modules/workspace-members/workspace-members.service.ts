import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { UsersRepository } from '../users/users.repository';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly membersRepository: WorkspaceMembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async findAll(workspaceId: string) {
    return this.membersRepository.findAll(workspaceId);
  }

  async addMember(workspaceId: string, dto: AddMemberDto, requestingUserId: string) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'No user with that email exists' });
    }

    // Cannot add someone who is already a member
    const existing = await this.membersRepository.findOne(workspaceId, user.id);
    if (existing) {
      throw new ConflictException({ code: 'ALREADY_MEMBER', message: 'User is already a member of this workspace' });
    }

    // Cannot assign OWNER role through this endpoint
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException({ code: 'CANNOT_ASSIGN_OWNER', message: 'Cannot assign OWNER role. Transfer ownership instead.' });
    }

    return this.membersRepository.create({ workspaceId, userId: user.id, role: dto.role });
  }

  async updateRole(
    workspaceId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    requestingMemberRole: WorkspaceRole,
  ) {
    const member = await this.membersRepository.findOne(workspaceId, targetUserId);
    if (!member) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Member not found in this workspace' });
    }

    // Cannot change the OWNER's role
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException({ code: 'CANNOT_CHANGE_OWNER_ROLE', message: 'Cannot change the workspace owner role' });
    }

    // ADMIN cannot promote to OWNER
    if (requestingMemberRole === WorkspaceRole.ADMIN && dto.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE', message: 'ADMINs cannot assign the OWNER role' });
    }

    return this.membersRepository.updateRole(workspaceId, targetUserId, dto.role);
  }

  async removeMember(workspaceId: string, targetUserId: string, requestingUserId: string) {
    const member = await this.membersRepository.findOne(workspaceId, targetUserId);
    if (!member) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Member not found in this workspace' });
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException({ code: 'CANNOT_REMOVE_OWNER', message: 'Cannot remove the workspace owner' });
    }

    await this.membersRepository.delete(workspaceId, targetUserId);
  }
}
