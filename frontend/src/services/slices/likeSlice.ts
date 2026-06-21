import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/services/store/store';
import { addToFavoritesApi, removeFromFavoritesApi } from '@/entities/skill/api/skill.api';
import { fetchUser, loginUser } from '@/services/thunk/authUser';

interface LikeState {
  likedItems: Record<number, boolean>;
  loading: boolean;
  error: string | null;
}

const initialState: LikeState = {
  likedItems: {},
  loading: false,
  error: null,
};

export const toggleLike = createAsyncThunk(
  'likes/toggleLike',
  async (itemId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const isCurrentlyLiked = state.likes.likedItems[itemId] || false;

      if (isCurrentlyLiked) {
        await removeFromFavoritesApi(itemId);
      } else {
        await addToFavoritesApi(itemId);
      }

      return { itemId, liked: !isCurrentlyLiked };
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 409) {
        return { itemId, liked: true };
      }
      if (status === 404) {
        return { itemId, liked: false };
      }
      return rejectWithValue('Ошибка при обработке лайка');
    }
  },
);

const likeSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    setLike: (state, action) => {
      const { itemId, liked } = action.payload;
      state.likedItems[itemId] = liked;
    },
    clearLikes: state => {
      state.likedItems = {};
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        const favoriteSkills = action.payload.user?.favoriteSkills ?? [];
        state.likedItems = {};
        favoriteSkills.forEach(skill => {
          state.likedItems[skill.id] = true;
        });
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const favoriteSkills = action.payload.user?.favoriteSkills ?? [];
        state.likedItems = {};
        favoriteSkills.forEach(skill => {
          state.likedItems[skill.id] = true;
        });
      })
      .addCase(toggleLike.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const { itemId, liked } = action.payload;
        state.likedItems[itemId] = liked;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setLike, clearLikes } = likeSlice.actions;
export default likeSlice.reducer;
