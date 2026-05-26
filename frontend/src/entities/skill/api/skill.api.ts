import { TSkillResponse } from './skill.types';
import { apiClient } from '@/shared/api';

export const getSkillsApi = async () => {
  return apiClient.get<TSkillResponse>('/api/skills');
};
