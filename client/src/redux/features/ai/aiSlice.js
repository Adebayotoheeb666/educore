import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = aiSlice.actions;
export default aiSlice.reducer;
