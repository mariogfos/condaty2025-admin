export type User = {
  has_image?: any;
  id: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  updated_at: string;
  role1: Role[];
};

export type Role = {
  id: number;
  name: string;
  description: string;
  laravel_through_key: string;
};

export type Image = {
  id: number;
  content_id: number;
  ext: string;
};

export type CommentUser = {
  id: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  updated_at?: string;
  has_image?: any;
};

export type Comment = {
  id: number;
  comment: string;
  user_id: string | null;
  person_id: string | null;
  type: string;
  event_id: number | null;
  content_id: number;
  created_at: string;
  user: CommentUser | null;
  person: CommentUser | null;
};

export type ContentItem = {
  id: number;
  destiny: string;
  client_id: string;
  user_id: string;
  title: string | null;
  description: string;
  url: string | null;
  type: "V" | "D" | "I";
  views: number;
  status: string;
  likes: number;
  nimages: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  comments_count: number;
  liked: 0 | 1;
  images: Image[];
  user: User;
  currentImageIndex?: number;
  isDescriptionExpanded?: boolean;
};
