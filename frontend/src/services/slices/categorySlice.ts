import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getCategoriesApi } from '@/entities/categories/api/categories.api';
import { Category } from '@/entities/categories/model/types';

type CategoriesState = {
  categories: Category[];
  loading: boolean;
  error: string | undefined;
};

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: undefined,
};

export const getCategories = createAsyncThunk<Category[]>('categories/getAll', async () =>
  getCategoriesApi(),
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  selectors: { getCategoriesSelector: state => state.categories },
  extraReducers: builder => {
    builder
      .addCase(getCategories.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(getCategories.rejected, state => {
        state.loading = false;
        state.error = 'Не удалось загрузить данные о навыках';
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      });
  },
});

export const { getCategoriesSelector } = categoriesSlice.selectors;
export const categoriesReducer = categoriesSlice.reducer;
