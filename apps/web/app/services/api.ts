import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';

import {
  EmailPasswordLoginDto,
  EmailPasswordLoginResponseDto,
  RefreshTokenResponseDto,
} from '@server/utils/auth/dto/login.dto';

export class ApiService {
  protected readonly axiosInstance: AxiosInstance;
  private accessToken: string | null = null; // Store access token in memory
  constructor(config: CreateAxiosDefaults) {
    config.withCredentials = true;
    config.headers = { 'Content-Type': 'application/json', ...config.headers };
    this.axiosInstance = axios.create(config);
    this.initializeRequestInterceptor();
    console.debug('ApiService initialized');
  }

  private initializeRequestInterceptor() {
    this.axiosInstance.interceptors.request.use(
      this.handleRequest,
      this.handleError,
    );
  }

  protected handleRequest(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    // Implement request configuration (e.g., adding authorization headers)
    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    } else {
      console.warn('No access token found in memory');
    }
    return config;
  }

  protected handleError(error: any): Promise<any> {
    // Implement error handling
    return Promise.reject(error);
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  // Add other methods (put, delete, etc.) as needed

  // Auth specific methods
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
const authService = new ApiService({ baseURL: serverUrl });
export { authService };
