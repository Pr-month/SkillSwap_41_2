import { createAsyncThunk } from '@reduxjs/toolkit';
import { AUTH_USER_SLICE } from '../slices/slicesName';
import { deleteCookie, setCookie } from '@/shared/utils/cookies';
import { getProfileApi } from '@/entities/user/api/user.api';
import { TUserResponse } from '@/entities/user/api/user.types';
import { TAuthResponse, TLoginData } from '@/entities/auth/api/auth.types';
import { loginUserApi, logoutApi } from '@/entities/auth/api/auth.api';

export const fetchUser = createAsyncThunk<TUserResponse, void>(
  `${AUTH_USER_SLICE}/fetchUser`,
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProfileApi();
      // Backend returns User directly, wrap to match TUserResponse shape
      const user = (data as unknown as { user?: unknown }).user
        ? data
        : ({ success: true, user: data } as unknown as TUserResponse);
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const loginUser = createAsyncThunk<TAuthResponse, TLoginData>(
  `${AUTH_USER_SLICE}/loginUser`,
  async (dataUser, { rejectWithValue }) => {
    try {
      const data = await loginUserApi(dataUser);
      if (data.accessToken) {
        // Сохраняем токены
        setCookie('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const logoutUserApi = createAsyncThunk(
  `${AUTH_USER_SLICE}/logoutUserApi`,
  async (_, { rejectWithValue }) => {
    try {
      const data = await logoutApi();
      deleteCookie('accessToken');
      localStorage.removeItem('refreshToken');
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
