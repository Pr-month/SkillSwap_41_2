import { catalogReducer } from '@/services/slices/catalogSlice';
import { exchangeReducer } from '@/services/slices/exchangeSlice';
import filtersReducer from '@/services/slices/filtersSlice';
import likeReducer from '@/services/slices/likeSlice';
import { registrationReducer } from '@/services/slices/registrationSlice';
import stepsSlice from '@/services/slices/stepSlice';
import { combineSlices, configureStore } from '@reduxjs/toolkit';
import {
  TypedUseSelectorHook,
  useDispatch as dispatchHook,
  useSelector as selectorHook,
} from 'react-redux';
import authSlice from '../slices/authSlice';
import { categoriesReducer } from '../slices/categorySlice';
import { citiesReducer } from '../slices/citiesSlice';
import { skillsReducer } from '../slices/skillsSlice';

export const rootReducer = combineSlices({
  register: registrationReducer,
  catalog: catalogReducer,
  exchange: exchangeReducer,
  skills: skillsReducer,
  [stepsSlice.name]: stepsSlice.reducer,
  filters: filtersReducer,
  likes: likeReducer,
  [authSlice.name]: authSlice.reducer,
  categories: categoriesReducer,
  cities: citiesReducer,
});

const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useDispatch: () => AppDispatch = dispatchHook;
export const useSelector: TypedUseSelectorHook<RootState> = selectorHook;

export default store;
