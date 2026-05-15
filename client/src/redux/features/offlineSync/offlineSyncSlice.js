import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const offlineSyncSlice = createSlice({
  name: 'offlineSync',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = offlineSyncSlice.actions;
export default offlineSyncSlice.reducer;
