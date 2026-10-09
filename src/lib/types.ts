export type ChatRole = "user" | "assistant";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  latest_version_number?: number | null;
  latest_code?: string | null;
  latest_prompt?: string | null;
}

export interface Version {
  id: string;
  project_id: string;
  code: string;
  prompt: string;
  version_number: number;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ProjectDetailResponse {
  project: Project;
  versions: Version[];
  messages: Message[];
}

export interface GenerateRequest {
  projectId: string;
  prompt: string;
  messages: Array<Pick<Message, "role" | "content">>;
  previousFiles?: Record<string, string>;
}

export interface ApiError {
  error: string;
}

export interface ProjectFile {
  path: string;
  content: string;
}
