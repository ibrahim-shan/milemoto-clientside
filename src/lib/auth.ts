// src/lib/auth.ts
import { get, post } from './api';
import { getAccessToken } from './authStorage';

import type {
  AuthOutputDto,
  MfaBackupCodesResponseDto,
  MfaChallengeDto,
  MfaSetupStartResponseDto,
  MfaSetupVerifyResponseDto,
  OkResponseDto,
  RefreshResponseDto,
  RegisterResponseDto,
  UserDto,
} from '@/types';

const AUTH = '/auth';

/** Attach Bearer to requests that require an access token (MFA setup endpoints). */
function authz(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ---------------- Register ---------------- */
export type RegisterInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  remember?: boolean;
};

export function register(input: RegisterInput): Promise<RegisterResponseDto> {
  return post<RegisterResponseDto>(`${AUTH}/register`, input);
}

/* ---------------- Login flows ---------------- */
export function login(input: {
  email: string;
  password: string;
  remember?: boolean;
}): Promise<AuthOutputDto | MfaChallengeDto> {
  // Server may return either tokens+user OR an MFA challenge
  return post<AuthOutputDto | MfaChallengeDto>(`${AUTH}/login`, input);
}

export function verifyMfaLogin(input: {
  challengeId: string;
  code: string; // 6-digit TOTP or backup code
}): Promise<AuthOutputDto> {
  return post<AuthOutputDto>(`${AUTH}/mfa/login/verify`, input);
}

/* ---------------- MFA setup (requires Bearer) ---------------- */
export function startMfaSetup(): Promise<MfaSetupStartResponseDto> {
  return post<MfaSetupStartResponseDto>(`${AUTH}/mfa/setup/start`, undefined, { headers: authz() });
}

export function verifyMfaSetup(input: {
  challengeId: string;
  code: string; // 6-digit
}): Promise<MfaSetupVerifyResponseDto> {
  return post<MfaSetupVerifyResponseDto>(`${AUTH}/mfa/setup/verify`, input, { headers: authz() });
}

export function regenBackupCodes(): Promise<MfaBackupCodesResponseDto> {
  return post<MfaBackupCodesResponseDto>(`${AUTH}/mfa/backup-codes/regen`, undefined, {
    headers: authz(),
  });
}

/* ---------------- Tokens & session ---------------- */
export function refresh(): Promise<RefreshResponseDto> {
  return post<RefreshResponseDto>(`${AUTH}/refresh`, {});
}

export async function logout(): Promise<OkResponseDto> {
  return post<OkResponseDto>(`${AUTH}/logout`, {});
}

/* ---------------- Password Reset ---------------- */
export function forgotPassword(email: string): Promise<OkResponseDto> {
  return post<OkResponseDto>(`${AUTH}/forgot`, { email });
}

export function resetPassword(input: { token: string; password: string }): Promise<OkResponseDto> {
  return post<OkResponseDto>(`${AUTH}/reset`, input);
}

// --- ADD THIS NEW FUNCTION ---
export function changePassword(input: {
  oldPassword: string;
  newPassword: string;
}): Promise<OkResponseDto> {
  return post<OkResponseDto>(`${AUTH}/change-password`, input, {
    headers: authz(), // authz() attaches the Bearer token
  });
}

// --- ADD THIS NEW FUNCTION ---
export function verifyEmail(token: string): Promise<OkResponseDto> {
  return post<OkResponseDto>(`${AUTH}/verify-email`, { token });
}

export function resendVerificationEmail(email: string): Promise<OkResponseDto> {
  return post<OkResponseDto>(`${AUTH}/verify-email/resend`, { email });
}

export function getMe(): Promise<UserDto> {
  return get<UserDto>(`${AUTH}/me`, {
    headers: authz(), // authz() attaches the Bearer token
  });
}

export type { UserDto, AuthOutputDto, MfaChallengeDto, OkResponseDto };
