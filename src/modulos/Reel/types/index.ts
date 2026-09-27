export type User = {
  has_image?: any;
  id: string;
  name: string;
  middle_name?: string;
  last_name: string;
  mother_last_name?: string;
  updated_at: string;
  role1: Role[];
  url_avatar?: string;
};

export type Role = {
  id: number;
  name: string;
  description: string;
  laravel_through_key: string;
};

export type ContentItem = {
  id: number;
  /** Enum numérico `ContentDestiny` (api#461). */
  destiny: number;
  client_id: string;
  user_id: string;
  title: string | null;
  description: string;
  url: string | null;
  /** Enum numérico `ContentType` (api#461): se compara con `esImagen`/`esVideo`/`esDocumento`. */
  type: number;
  views: number;
  status: string;
  likes: number;
  nimages: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  comments_count: number;
  liked: 0 | 1;
  images: {
    id: number;
    ext: string;
    entity_id?: string;
  }[];
  files: string[];
  user: User;
  currentImageIndex?: number;
  isDescriptionExpanded?: boolean;
  owner: User;
};
