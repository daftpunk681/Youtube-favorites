export type CategoryColor = "teal" | "orange" | "purple" | "blue" | "rose";
export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
}
export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  notes: string;
  featured: boolean;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}
export interface LibraryData {
  videos: Video[];
  categories: Category[];
  demo: boolean;
  unavailable?: boolean;
}
export interface VideoInput {
  url: string;
  title: string;
  author: string;
  notes: string;
  featured: boolean;
  categories: string[];
}
