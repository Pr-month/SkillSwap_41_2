export class SkillResponseDto {
  id!: number;
  title!: string;
  images?: string[];
  description?: string;
  category!: { id: number; parentSlug?: string };
}
