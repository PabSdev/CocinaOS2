export interface SessionUser {
  $id: string;
  email: string;
  name: string;
  status: boolean;
  $createdAt: string;
  role: 'cliente' | 'cocinero' | 'admin';
}

export interface AuthSession {
  $id: string;
  userId: string;
  expire: string;
  provider: string;
}

export interface AuthActionState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
  };
  user?: SessionUser;
  remainingAttempts?: number;
  lockedUntil?: number;
}
