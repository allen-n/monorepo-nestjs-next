import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PasswordlessUser } from '@utils/auth/dto/passwordless-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<PasswordlessUser> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException(
        `Error: Incorrect password for user with email ${username}`,
      );
    }
    return user;
  }
}
