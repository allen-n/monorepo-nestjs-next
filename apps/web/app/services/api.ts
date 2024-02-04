import axios, {
  AxiosError,
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

export interface ApiError {
  message: string;
  data: any;
}

export class ApiService {
  protected readonly axiosInstance: AxiosInstance;
  private accessToken: string | null = null; // Store access token in memory
  constructor(config: CreateAxiosDefaults) {
    config.withCredentials = true;
    config.headers = { 'Content-Type': 'application/json', ...config.headers };
    this.axiosInstance = axios.create(config);
    this.handleRequest = this.handleRequest.bind(this);
    this.handleError = this.handleError.bind(this);
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
    // Implement additional request configuration (e.g., adding authorization headers)
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
  ): Promise<EmailPasswordLoginResponseDto | ApiError> {
    console.log('login', credentials);
    try {
      const response = await this.post<EmailPasswordLoginResponseDto>(
        'v1/auth/login',
        credentials,
      );
      this.setAccessToken(response.accessToken);
      console.log('login response', response);
      return response;
    } catch (error: any) {
      const e = error as AxiosError;
      throw { message: e.message, data: e.response?.data };
    }
  }

  public async logout(): Promise<void> {
    // Call server endpoint to clear the HttpOnly cookie
    console.log('logout');
    await this.get('v1/auth/logout');
    this.clearAccessToken();
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
    this.axiosInstance.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${token}`;
  }

  private clearAccessToken(): void {
    this.accessToken = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
if (!serverUrl) {
  throw new Error('Server URL not found');
}
const apiService = new ApiService({ baseURL: serverUrl });
export { apiService };
