export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  dob: string;
  gender: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
