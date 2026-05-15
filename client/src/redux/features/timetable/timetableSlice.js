import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const timetableSlice = createSlice({
  name: 'timetable',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = timetableSlice.actions;
export default timetableSlice.reducer;
