import { User } from '@prisma/client';

export type PasswordlessUser = Omit<User, 'passwordHash'>;
