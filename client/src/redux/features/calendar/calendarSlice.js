import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = calendarSlice.actions;
export default calendarSlice.reducer;
