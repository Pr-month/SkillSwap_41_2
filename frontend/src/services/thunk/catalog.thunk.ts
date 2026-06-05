import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUsersApi } from "@/entities/user/api/user.api";

const DOWNLOAD_TIME = 1000; // Время для имитации загрузки при подгрузке следующих страниц

// Thunk для первой загрузки
export const fetchCatalog = createAsyncThunk(
  'catalog/fetch',
  async ({ offset, limit }: { offset: number; limit: number }) => {
    const res = await getUsersApi({ limit, offset });

    return {
      users: res.data,
      total: res.meta.total,
      offset: res.meta.offset,
      limit: res.meta.limit,
      totalPages: res.meta.totalPages,
      nextOffset: res.meta.offset + res.meta.limit, // Следующее смещение
    };
  },
);

// Thunk для подгрузки следующих страниц
export const fetchMoreCatalog = createAsyncThunk(
  'catalog/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as any;
    const { offset, limit, hasMore } = state.catalog.pagination;

    // Проверяем, есть ли еще данные
    if (!hasMore) {
      return rejectWithValue('No more data');
    }

    await new Promise(resolve => setTimeout(resolve, DOWNLOAD_TIME));
    const nextOffset = offset;

    // Запрашиваем следующую порцию данных
    const res = await getUsersApi({ limit, offset: nextOffset });

    return {
      users: res.data,
      offset: res.meta.offset,
      limit: res.meta.limit,
      total: res.meta.total,
      totalPages: res.meta.totalPages,
      nextOffset: res.meta.offset + res.meta.limit,
      hasMore: res.meta.offset + res.meta.limit < res.meta.total,
    };
  },
);