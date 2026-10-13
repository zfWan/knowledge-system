export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface ApiResp<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}
