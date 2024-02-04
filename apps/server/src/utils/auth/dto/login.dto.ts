export class EmailPasswordLoginDto {
  email: string;
  password: string;
}

export class EmailPasswordLoginResponseDto {
  refreshToken: string;
  accessToken: string;
  username: string;
}

export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}
