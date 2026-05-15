import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = teacherSlice.actions;
export default teacherSlice.reducer;
