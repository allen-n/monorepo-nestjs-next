import { CreateUserDto } from '@api/users/dto/create-user.dto';
import { UsersService } from '@api/users/users.service';
import { CookieSerializeOptions } from '@fastify/cookie';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeController,
  ApiTags,
} from '@nestjs/swagger';
import {
  EmailPasswordLoginResponseDto,
  RefreshTokenResponseDto,
} from '@utils/auth/dto/login.dto';
import {
  CheckPasswordResetDto,
  PasswordResetDto,
} from '@utils/auth/dto/password-reset.dto';
import { JwtAuthGuard } from '@utils/auth/guards/jwt-auth.guard';
import { RefreshTokenGuard } from '@utils/auth/guards/refresh-token.guard';
import {
  JwtAuthenticatedRequest,
  PasswordAuthenticatedRequest,
} from '@utils/auth/types';
import { FastifyReply } from 'fastify';
import {
  JwtBearer,
  JwtHeader,
  SHOW_CONTROLLER_IN_SWAGGER,
  sJwtBearer,
} from '../header';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

const refreshTokenCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  secure: true,
  signed: true,
  sameSite: 'strict',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  path: `/`,
};

const CONTROLLER_NAME = `auth`;
@ApiTags(CONTROLLER_NAME)
@ApiExcludeController(SHOW_CONTROLLER_IN_SWAGGER)
@JwtBearer
@Controller(CONTROLLER_NAME)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('signup')
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const res = await this.authService.signup(createUserDto);
    if (res.tokens) {
      response.setCookie(
        'refreshToken',
        res.tokens.refreshToken,
        refreshTokenCookieOptions,
      );
    }

    return res;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  async login(
    @Request() req: PasswordAuthenticatedRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<EmailPasswordLoginResponseDto> {
    const res = await this.authService.login(req.user);
    response.setCookie(
      'refreshToken',
      res.refreshToken,
      refreshTokenCookieOptions,
    );
    return res;
  }

  @Get('logout')
  @JwtHeader
  @ApiBearerAuth(sJwtBearer)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req: JwtAuthenticatedRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    response.clearCookie('refreshToken');
    return this.authService.logout(req.user);
  }

  @Get('refresh')
  @ApiBearerAuth(sJwtBearer)
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @Request() req: JwtAuthenticatedRequest,
  ): Promise<RefreshTokenResponseDto> {
    if (!req.user.refreshToken) {
      throw new Error('No refresh token found in request.');
    }
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @Post('password-reset/start')
  async passwordReset(@Body() data: PasswordResetDto) {
    return this.authService.sendPasswordResetEmail(data.email);
  }

  @Post('password-reset/check')
  async checkPasswordReset(@Body() data: CheckPasswordResetDto) {
    return this.authService.checkPasswordResetToken(
      data.email,
      data.resetToken,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'deleteOldResets' })
  @Get('password-reset/delete-old')
  async deleteOldResets() {
    const startTime = new Date(new Date().getTime() - 600001);
    return this.userService.deletePasswordResetsOlderThan(startTime);
  }
}
