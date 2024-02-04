'use server';

// import { signIn } from '@/auth';
import { authService } from '@web/app/services/auth';

export async function authenticate(formData: FormData) {
  try {
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    await authService.login({
      email: email,
      password: password,
    });
  } catch (error) {
    console.error('Auth error', error);
    throw error;
  }
}
