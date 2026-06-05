import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/entities/user/model/types';
import { getUsersApi } from '@/entities/user/api/user.api';

const DOWNLOAD_TIME = 1000; // Время для имитации загрузки при подгрузке следующих страниц

interface CatalogState {
  users: User[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  // Пагинация
  pagination: {
    currentPage: number; // Используем offset
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const initialState: CatalogState = {
  users: [],
  loading: false,
  error: null,
  searchQuery: '',
  pagination: {
    currentPage: 1, // Начинаем с 1
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: true,
  },
};

// Thunk для первой загрузки
export const fetchCatalog = createAsyncThunk<
  { users: User[]; total: number; currentPage: number; limit: number; totalPages: number },
  { page?: number; limit?: number }
>('catalog/fetch', async params => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;

  // Сервер ожидает offset как номер страницы
  const res = await getUsersApi({ limit, offset: page });

  return {
    users: res.data,
    total: res.meta.total,
    currentPage: res.meta.offset, // Используем offset из ответа как текущую страницу
    limit: res.meta.limit,
    totalPages: res.meta.totalPages,
  };
});

// Thunk для подгрузки следующих страниц
export const fetchMoreCatalog = createAsyncThunk(
  'catalog/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const { currentPage, totalPages, limit } = state.catalog.pagination;

    const nextPage = currentPage + 1;

    // Проверяем, есть ли следующая страница
    if (nextPage > totalPages) {
      return rejectWithValue('No more pages');
    }

    await new Promise(resolve => setTimeout(resolve, DOWNLOAD_TIME));

    // Запрашиваем следующую страницу (offset = номер страницы)
    const res = await getUsersApi({ limit, offset: nextPage });

    return {
      users: res.data,
      currentPage: res.meta.offset,
      hasMore: nextPage < totalPages,
    };
  },
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload.toLowerCase();
    },
    clearError(state) {
      state.error = null;
    },
    resetCatalog(state) {
      state.users = [];
      state.pagination = {
        currentPage: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: true,
      };
    },
  },
  extraReducers: builder => {
    builder
      // Первая загрузка
      .addCase(fetchCatalog.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.users = action.payload.users;
        state.pagination = {
          currentPage: action.payload.currentPage,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          hasMore: action.payload.currentPage < action.payload.totalPages,
        };
        state.loading = false;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })

      // Подгрузка следующих страниц
      .addCase(fetchMoreCatalog.pending, state => {
        state.loading = true;
      })
      .addCase(fetchMoreCatalog.fulfilled, (state, action) => {
        state.users = [...state.users, ...action.payload.users];
        state.pagination.currentPage = action.payload.currentPage;
        state.pagination.hasMore = action.payload.hasMore;
        state.loading = false;
      })
      .addCase(fetchMoreCatalog.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === 'No more data') {
          state.pagination.hasMore = false;
        } else {
          state.error = action.error.message || 'Failed to load more users';
        }
      });
  },
});

export const { setSearchQuery, resetCatalog } = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;
