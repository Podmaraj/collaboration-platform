import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { UsersRepository } from '../users/users.repository';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockMembersRepository = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateRole: jest.fn(),
  delete: jest.fn(),
};

const mockUsersRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-2',
  name: 'Bob',
  email: 'bob@example.com',
  passwordHash: 'hash',
  tokenVersion: 0,
  refreshTokenHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMember = {
  id: 'member-1',
  workspaceId: 'ws-1',
  userId: 'user-2',
  role: WorkspaceRole.MEMBER,
  createdAt: new Date(),
};

const mockOwnerMember = { ...mockMember, userId: 'owner-1', role: WorkspaceRole.OWNER };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkspaceMembersService', () => {
  let service: WorkspaceMembersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceMembersService,
        { provide: WorkspaceMembersRepository, useValue: mockMembersRepository },
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<WorkspaceMembersService>(WorkspaceMembersService);
  });

  // ── addMember ─────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('should add a member to the workspace', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockMembersRepository.findOne.mockResolvedValue(null);
      mockMembersRepository.create.mockResolvedValue(mockMember);

      const result = await service.addMember(
        'ws-1',
        { email: 'bob@example.com', role: WorkspaceRole.MEMBER },
        'requester-1',
      );

      expect(result).toEqual(mockMember);
      expect(mockMembersRepository.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        userId: 'user-2',
        role: WorkspaceRole.MEMBER,
      });
    });

    it('should throw NotFoundException if user email does not exist', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.addMember('ws-1', { email: 'nobody@example.com', role: WorkspaceRole.MEMBER }, 'req'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      await expect(
        service.addMember('ws-1', { email: 'bob@example.com', role: WorkspaceRole.MEMBER }, 'req'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when trying to assign OWNER role', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockMembersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addMember('ws-1', { email: 'bob@example.com', role: WorkspaceRole.OWNER }, 'req'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateRole ────────────────────────────────────────────────────────────

  describe('updateRole', () => {
    it('should update a member role', async () => {
      const updatedMember = { ...mockMember, role: WorkspaceRole.ADMIN };
      mockMembersRepository.findOne.mockResolvedValue(mockMember);
      mockMembersRepository.updateRole.mockResolvedValue(updatedMember);

      const result = await service.updateRole(
        'ws-1',
        'user-2',
        { role: WorkspaceRole.ADMIN },
        WorkspaceRole.OWNER,
      );

      expect(result.role).toBe(WorkspaceRole.ADMIN);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRole('ws-1', 'ghost', { role: WorkspaceRole.ADMIN }, WorkspaceRole.OWNER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to change OWNER role', async () => {
      mockMembersRepository.findOne.mockResolvedValue(mockOwnerMember);

      await expect(
        service.updateRole('ws-1', 'owner-1', { role: WorkspaceRole.ADMIN }, WorkspaceRole.OWNER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when ADMIN tries to promote to OWNER', async () => {
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      await expect(
        service.updateRole('ws-1', 'user-2', { role: WorkspaceRole.OWNER }, WorkspaceRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── removeMember ──────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('should remove a non-owner member', async () => {
      mockMembersRepository.findOne.mockResolvedValue(mockMember);
      mockMembersRepository.delete.mockResolvedValue(undefined);

      await expect(
        service.removeMember('ws-1', 'user-2', 'requester-1'),
      ).resolves.not.toThrow();
      expect(mockMembersRepository.delete).toHaveBeenCalledWith('ws-1', 'user-2');
    });

    it('should throw NotFoundException if member not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeMember('ws-1', 'ghost', 'requester-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to remove the OWNER', async () => {
      mockMembersRepository.findOne.mockResolvedValue(mockOwnerMember);

      await expect(
        service.removeMember('ws-1', 'owner-1', 'requester-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
