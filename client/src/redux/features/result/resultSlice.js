import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const resultSlice = createSlice({
  name: 'result',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = resultSlice.actions;
export default resultSlice.reducer;
