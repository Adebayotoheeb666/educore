import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
};

const schoolSlice = createSlice({
  name: 'school',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setLoading } = schoolSlice.actions;
export default schoolSlice.reducer;
