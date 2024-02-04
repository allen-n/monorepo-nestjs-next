'use server';

import { ApiError, apiService } from '@web/app/services/api';

export async function authenticate(formData: FormData) {
  try {
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    await apiService.login({
      email: email,
      password: password,
    });
  } catch (error) {
    const e = error as ApiError;
    console.error('Auth error', e);
  }
}

export async function logout() {
  try {
    await apiService.logout();
  } catch (error) {
    const e = error as ApiError;
    console.error('Logout error', e);
  }
}
