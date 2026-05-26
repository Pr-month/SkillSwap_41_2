import { deleteCookie, getCookie, setCookie } from '@/shared/utils/cookies';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenStorage = {
  getAccessToken: () => getCookie(ACCESS_TOKEN_KEY),

  setAccessToken: (token: string) =>
    setCookie(ACCESS_TOKEN_KEY, token),

  removeAccessToken: () =>
    deleteCookie(ACCESS_TOKEN_KEY),

  getRefreshToken: () =>
    localStorage.getItem(REFRESH_TOKEN_KEY),

  setRefreshToken: (token: string) =>
    localStorage.setItem(REFRESH_TOKEN_KEY, token),

  removeRefreshToken: () =>
    localStorage.removeItem(REFRESH_TOKEN_KEY),

  clear: () => {
    deleteCookie(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};