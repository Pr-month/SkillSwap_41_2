import { skillsCategories } from '@/shared/lib/categories';

export type SkillCategory = keyof typeof skillsCategories;
export type SkillSubcategory<T extends SkillCategory> = (typeof skillsCategories)[T][number];

export type Skill = {
  id: number;
  title: string;
  images?: string[];
  description?: string;
  category: { id: number; parentSlug?: string };
};

export type CustomSkill = Skill & {
  name: string;
  image: string[] | File[];
  description: string;
  customSkillId: string;
};
