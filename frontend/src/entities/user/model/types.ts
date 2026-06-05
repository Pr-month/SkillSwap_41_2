import { Category } from '@/entities/categories/model/types';
import { TCity } from '@/entities/cities/model/cities';
import { Skill } from '@/entities/skill/model/types';

export type User = {
  id: number;
  name: string;
  about?: string;
  birthdate: string;
  city: TCity;
  gender: GenderOption['value'];
  avatar: string | File[];
  skills: Skill[];
  favoriteSkills: Skill[];
  wantToLearn: Category[];
  email?: string;
  createdAt: string;
};

export type ExchangeRequest = {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId?: string;
  isRead: boolean;
  createdAt: string;
};

export type ExperienceOption = {
  value: 'all' | 'want-to-learn' | 'can-teach';
  label: string;
};

export type GenderOption = {
  value: 'other' | 'male' | 'female';
  label: string;
};

export type UserCardProps = User & {
  showDetails?: boolean;
  showLike?: boolean;
  showDescription?: boolean;
};
