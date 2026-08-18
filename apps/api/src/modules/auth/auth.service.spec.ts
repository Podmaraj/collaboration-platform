import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('argon2');
const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

const mockAuthRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  incrementTokenVersion: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  passwordHash: 'hashed-password',
  tokenVersion: 0,
  refreshTokenHash: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should create a new user and return their profile', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockedArgon2.hash.mockResolvedValue('hashed-pw' as never);
      mockAuthRepository.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockAuthRepository.create).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'hashed-pw',
      });
    });

    it('should throw ConflictException if email is already taken', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ name: 'Alice', email: 'alice@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return tokens and user profile on valid credentials', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockedArgon2.verify.mockResolvedValue(true as never);
      mockedArgon2.hash.mockResolvedValue('hashed-refresh' as never);
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login({
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.email).toBe('alice@example.com');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noone@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockedArgon2.verify.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'alice@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      const userWithHash = { ...mockUser, refreshTokenHash: 'stored-hash' };
      mockAuthRepository.findById.mockResolvedValue(userWithHash);
      mockedArgon2.verify.mockResolvedValue(true as never);
      mockedArgon2.hash.mockResolvedValue('new-hash' as never);
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh('user-1', 'incoming-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw ForbiddenException if user not found', async () => {
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(service.refresh('user-1', 'some-token')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if refresh token hash does not match', async () => {
      const userWithHash = { ...mockUser, refreshTokenHash: 'stored-hash' };
      mockAuthRepository.findById.mockResolvedValue(userWithHash);
      mockedArgon2.verify.mockResolvedValue(false as never);

      await expect(service.refresh('user-1', 'bad-token')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear refresh token and increment token version', async () => {
      mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);
      mockAuthRepository.incrementTokenVersion.mockResolvedValue(undefined);

      await service.logout('user-1');

      expect(mockAuthRepository.updateRefreshToken).toHaveBeenCalledWith('user-1', null);
      expect(mockAuthRepository.incrementTokenVersion).toHaveBeenCalledWith('user-1');
    });
  });

  // ── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('should return user profile for valid userId', async () => {
      mockAuthRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getMe('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('alice@example.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
