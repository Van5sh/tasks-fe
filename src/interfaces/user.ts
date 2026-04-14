export interface User {
  id: string;
  role: string;
  username?: string;
  email?: string;
  dob?: string;
  gender?: string;
}

export interface LocalProfile {
  username?: string;
  email?: string;
  dob?: string;
  gender?: string;
}

export interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  dob?: string;
  gender?: string;
}
