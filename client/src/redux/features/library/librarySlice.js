import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = librarySlice.actions;
export default librarySlice.reducer;
