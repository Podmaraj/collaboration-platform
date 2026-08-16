import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Creates a new user account. Does NOT issue tokens — requires login after register.
   */
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return { user };
  }

  /**
   * POST /api/auth/login
   * Returns access token in body, refresh token in HttpOnly cookie.
   */
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(dto);
    const { refreshToken, ...rest } = result as typeof result & { refreshToken?: string };

    if (refreshToken) {
      reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
    }

    return rest;
  }

  /**
   * POST /api/auth/refresh
   * Reads refresh token from HttpOnly cookie, issues new access + refresh tokens.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const incomingToken = (req.cookies as Record<string, string>)?.[REFRESH_TOKEN_COOKIE];

    const payload = this.authService.validateRefreshToken(incomingToken ?? '');
    const { accessToken, refreshToken } = await this.authService.refresh(
      payload.sub,
      incomingToken!,
    );

    reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

    return { accessToken };
  }

  /**
   * POST /api/auth/logout
   * Clears the refresh token cookie and invalidates the server-side token.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.authService.logout(user.sub);
    reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });
  }

  /**
   * GET /api/auth/me
   * Returns the authenticated user's profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.authService.getMe(user.sub);
    return { user: profile };
  }
}
