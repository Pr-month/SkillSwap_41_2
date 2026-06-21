import type { RootState } from '@/services/store/store';

export const selectIsLiked = (state: RootState, itemId: number): boolean =>
  state.likes.likedItems[itemId] ?? false;

export const selectLikesLoading = (state: RootState): boolean => state.likes.loading;

export const selectLikedItems = (state: RootState): Record<number, boolean> =>
  state.likes.likedItems;
