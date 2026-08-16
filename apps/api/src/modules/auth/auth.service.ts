import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, RefreshTokenPayload } from '../../common/types/jwt-payload.type';
import { User } from '@prisma/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  accessToken: string;
  user: UserProfile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfile> {
    // Check for duplicate email
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.authRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.toProfile(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      // Use the same error for both "not found" and "wrong password" to prevent user enumeration
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user);

    return {
      accessToken,
      user: this.toProfile(user),
      // refreshToken returned separately for cookie setting
      ...(refreshToken && { refreshToken }),
    };
  }

  async refresh(userId: string, incomingRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }

    const tokenValid = await argon2.verify(user.refreshTokenHash, incomingRefreshToken);
    if (!tokenValid) {
      throw new ForbiddenException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user);

    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.updateRefreshToken(userId, null);
    await this.authRepository.incrementTokenVersion(userId);
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return this.toProfile(user);
  }

  validateRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new ForbiddenException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m'),
    });
  }

  private async generateAndStoreRefreshToken(user: User): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
    };
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
    });

    // Hash before storing — if DB is leaked, tokens are still useless
    const hash = await argon2.hash(refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hash);

    return refreshToken;
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
