import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = examSlice.actions;
export default examSlice.reducer;
