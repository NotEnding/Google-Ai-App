
export interface Photo {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
  name: string;
  timestamp: number;
  category: string;
  description: string;
  tags: string[]; // New field for AI labels
  location?: string;
  videoUrl?: string;
  isAnimating?: boolean;
}

export enum ViewMode {
  TIMELINE = 'TIMELINE',
  GALLERY = 'GALLERY'
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', icon: 'fa-layer-group' },
  { id: 'nature', label: 'Nature', icon: 'fa-leaf' },
  { id: 'urban', label: 'Urban', icon: 'fa-city' },
  { id: 'people', label: 'People', icon: 'fa-users' },
  { id: 'food', label: 'Food', icon: 'fa-utensils' },
  { id: 'travel', label: 'Travel', icon: 'fa-plane' },
  { id: 'other', label: 'Other', icon: 'fa-ellipsis' }
];
