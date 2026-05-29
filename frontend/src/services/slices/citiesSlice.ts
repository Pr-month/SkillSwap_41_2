import { getCitiesApi } from '@/entities/cities/api/cities.api';
import { TCity } from '@/entities/cities/api/cities.dto';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

type CitiesState = {
  cities: TCity[];
  loading: boolean;
  error: string | undefined;
};

const initialState: CitiesState = {
  cities: [],
  loading: false,
  error: undefined,
};

export const getCities = createAsyncThunk<TCity[]>('cities', async () => getCitiesApi());
const citiesSlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {},
  selectors: { getCitiesSelector: state => state.cities },
  extraReducers: builder => {
    builder
      .addCase(getCities.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(getCities.rejected, state => {
        state.loading = false;
        state.error = 'Не удалось загрузить данные о городах';
      })
      .addCase(getCities.fulfilled, (state, action) => {
        state.cities = action.payload;
        state.loading = false;
      });
  },
});

export const { getCitiesSelector } = citiesSlice.selectors;
export const citiesReducer = citiesSlice.reducer;
