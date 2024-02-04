import {
  EmailPasswordLoginDto,
  EmailPasswordLoginResponseDto,
  RefreshTokenResponseDto,
} from '@server/utils/auth/dto/login.dto';
import { ApiService } from '@web/app/services/api';
import { InternalAxiosRequestConfig } from 'axios';

class AuthService extends ApiService {
  private accessToken: string | null = null; // Store access token in memory

  constructor(baseURL: string) {
    super({
      baseURL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('AuthService initialized');
  }

  protected handleRequest(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    console.log('AuthService handleRequest', config, this);
    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    } else {
      console.warn('No access token found in memory');
    }
    return config;
  }

  public async login(
    credentials: EmailPasswordLoginDto,
  ): Promise<EmailPasswordLoginResponseDto> {
    console.log('login this', this);
    const response = await this.post<EmailPasswordLoginResponseDto>(
      'v1/auth/login',
      credentials,
    );
    this.accessToken = response.accessToken;

    return response;
  }

  public logout(): void {
    this.clearAccessToken();
    // Call server endpoint to clear the HttpOnly cookie
    this.post('/logout');
  }

  public async refreshToken(): Promise<void> {
    // The server endpoint `/refresh-token` validates the HttpOnly cookie and returns a new access token
    const response = await this.post<RefreshTokenResponseDto>(
      'v1/auth/refresh',
      {},
    );
    this.setAccessToken(response.accessToken);
  }

  private setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private clearAccessToken(): void {
    this.accessToken = null;
  }
}
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
if (!serverUrl) {
  throw new Error('Server URL not found');
}
const authService = new AuthService(serverUrl);
export { authService };
