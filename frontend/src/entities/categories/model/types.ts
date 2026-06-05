type CategorySlug =
  | 'business'
  | 'creativity'
  | 'languages'
  | 'development'
  | 'health'
  | 'other';

export type Category = {
  id: number;
  name: string;
  slug?: CategorySlug;
  subCategory?: Category[];
  parentSlug?: CategorySlug; // Для Skills
};
