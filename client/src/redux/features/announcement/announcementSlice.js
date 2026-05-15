import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = announcementSlice.actions;
export default announcementSlice.reducer;
