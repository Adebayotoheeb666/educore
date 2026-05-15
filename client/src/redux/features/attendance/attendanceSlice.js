import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = attendanceSlice.actions;
export default attendanceSlice.reducer;
