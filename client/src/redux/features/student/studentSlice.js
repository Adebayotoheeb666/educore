import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = studentSlice.actions;
export default studentSlice.reducer;
