import { getSkillsApi } from '@/entities/skill/api/skill.api';
import { TGetSkillsParams } from '@/entities/skill/api/skill.types';
import { Skill } from '@/entities/skill/model/types';
import { createAsyncThunk } from '@reduxjs/toolkit';

// Получение всех навыков
export const getSkills = createAsyncThunk<Skill[]>('skills/getAll', async () => {
  const response = await getSkillsApi();

  return response;
});

// Поиск навыков
export const searchSkills = createAsyncThunk<Skill[], string>(
  'skills/searchSkills',
  async (search: string) => {
    const params: TGetSkillsParams = {};

    if (search && search.trim().length >= 3) {
      params.search = search;
    }

    const response = await getSkillsApi(params);

    return response;
  },
);
