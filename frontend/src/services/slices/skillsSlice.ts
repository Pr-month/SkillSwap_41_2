import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getSkills, searchSkills } from '../thunk/skills.thunk';
import { Skill } from '@/entities/skill/model/types';

type SkillsState = {
  skills: Skill[];
  searchResults: Skill[];
  loading: boolean;
  error: string | undefined;
  searchQuery: string;
};

const initialState: SkillsState = {
  skills: [],
  searchResults: [],
  loading: false,
  error: undefined,
  searchQuery: '',
};

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    clearSkillSearch: state => {
      state.searchResults = [];
      state.searchQuery = '';
      state.error = undefined;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload.toLowerCase();
      if (!action.payload || action.payload.length < 3) {
        state.searchResults = [];
      }
    },
  },
  selectors: {
    getSkillsSelector: state => state.skills,
    getLoadingSelector: state => state.loading,
    getErrorSelector: state => state.error,
    getSearchQuerySelector: state => state.searchQuery,
  },
  extraReducers: builder => {
    builder
      // getSkills cases
      .addCase(getSkills.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(getSkills.fulfilled, (state, action) => {
        state.skills = action.payload;
        state.loading = false;
        state.error = undefined;
      })
      .addCase(getSkills.rejected, state => {
        state.loading = false;
        state.error = 'Не удалось загрузить данные о навыках';
      })

      // searchSkills cases
      .addCase(searchSkills.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(searchSkills.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.searchQuery = action.meta.arg;
        state.loading = false;
        state.error = undefined;
      })
      .addCase(searchSkills.rejected, state => {
        state.loading = false;
        state.error = 'Не удалось выполнить поиск навыков';
      });
  },
});

export const { setSearchQuery, clearSkillSearch } = skillsSlice.actions;
export const {
  getSkillsSelector,
  getLoadingSelector,
  getErrorSelector,
  getSearchQuerySelector,
} = skillsSlice.selectors;
export const skillsReducer = skillsSlice.reducer;
