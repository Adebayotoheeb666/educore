import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = analyticsSlice.actions;
export default analyticsSlice.reducer;
