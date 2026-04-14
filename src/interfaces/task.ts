export interface TaskInviteUser {
  user_id: string;
  email: string;
  access: "normal";
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  owner_id: string;
  access: "admin" | "normal";
  invited_users: TaskInviteUser[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreateRequest {
  title: string;
  description: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface TaskInviteRequest {
  email: string;
}
