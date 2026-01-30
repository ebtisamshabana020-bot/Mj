
export enum UserRole {
  USER = 'USER',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  joinedGroups: string[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  passwordHash: string;
  imageUrl?: string;
  membersCount: number;
}

export interface Exam {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  questions: Question[];
  creatorId: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  type: 'MCQ' | 'TF';
}

export interface EncryptedMessage {
  id: string;
  senderId: string;
  senderName: string;
  examId: string;
  encryptedContent: string; // Base64 cipher text
  timestamp: number;
}

// Added ImageEditState interface to fix "Module has no exported member 'ImageEditState'" error in ImageEditor.tsx
export interface ImageEditState {
  originalImage: string | null;
  generatedImage: string | null;
  prompt: string;
  isLoading: boolean;
  error: string | null;
}

export enum AppView {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  GROUPS = 'GROUPS',
  GROUP_DETAIL = 'GROUP_DETAIL',
  EXAM_TAKER = 'EXAM_TAKER',
  EXAM_CREATOR = 'EXAM_CREATOR',
  ADMIN_PANEL = 'ADMIN_PANEL',
  PROFILE = 'PROFILE',
  // Added IMAGE_EDITOR to AppView enum to fix "Property 'IMAGE_EDITOR' does not exist on type 'typeof AppView'" error in Dashboard.tsx
  IMAGE_EDITOR = 'IMAGE_EDITOR'
}
