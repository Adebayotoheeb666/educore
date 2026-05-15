import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const feeSlice = createSlice({
  name: 'fee',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = feeSlice.actions;
export default feeSlice.reducer;
