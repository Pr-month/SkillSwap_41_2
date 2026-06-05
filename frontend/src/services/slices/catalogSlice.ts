import { createSlice } from '@reduxjs/toolkit';
import { User } from '@/entities/user/model/types';
import { fetchCatalog, fetchMoreCatalog } from '../thunk/catalog.thunk';

interface CatalogState {
  users: User[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  // Пагинация
  pagination: {
    offset: number;
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
    offset: 0,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: true,
  },
};

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
        offset: 0,
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
          offset: action.payload.nextOffset,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          hasMore: action.payload.nextOffset < action.payload.total,
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
        state.pagination = {
          offset: action.payload.nextOffset,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          hasMore: action.payload.hasMore,
        };
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

export const { setSearchQuery, resetCatalog, clearError } = catalogSlice.actions;
export const catalogReducer = catalogSlice.reducer;
