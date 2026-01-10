
export type Role = 'Admin' | 'User';

export interface User {
  id: string;
  username: string;
  role: Role;
  password?: string;
  displayName?: string;
  profilePic?: string;
  isPrivate?: boolean; // Privacy setting for comments
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: number;
  replies: Comment[];
  likes: string[];
}

export type MediaType = 'image' | 'video' | 'document' | 'none';

export interface QAEntry {
  id: string;
  authorId: string; // The ID of the user/admin who created the post
  category: string;
  subCategory: string;
  topic: string;
  question: string;
  answer: string;
  source: string;
  createdAt: number;
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  mediaUrl?: string;
  mediaType?: MediaType;
  mediaName?: string;
}

export interface CategoryGroup {
  name: string;
  subCategories: string[];
}
