import { post } from './api';

export type RegisterInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
};

export type RegisterOutput = {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    role: 'user' | 'admin';
  };
};

export async function register(input: RegisterInput): Promise<RegisterOutput> {
  return post<RegisterOutput>('/auth/register', input);
}

export type UserShape = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: 'user' | 'admin';
};
export type AuthOutput = { accessToken: string; user: UserShape };

export async function login(input: { email: string; password: string }): Promise<AuthOutput> {
  return post<AuthOutput>('/auth/login', input);
}

export async function refresh(): Promise<{ accessToken: string }> {
  return post('/auth/refresh', {});
}

export async function logout(): Promise<void> {
  await post('/auth/logout', {});
}
