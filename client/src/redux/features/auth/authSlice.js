import { createSlice } from '@reduxjs/toolkit';

const readLocal = (key, fallback = null) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return fallback; }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: readLocal('educore_user'),
    token: localStorage.getItem('accessToken') || null,
    isAuthenticated: Boolean(localStorage.getItem('accessToken')),
    loading: false,
  },
  reducers: {
    setUser: (state, action) => {
      const u = action.payload;
      state.user = u;
      state.token = u.token || state.token;
      state.isAuthenticated = true;
      try { localStorage.setItem('educore_user', JSON.stringify(u)); } catch {}
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      try { localStorage.removeItem('educore_user'); localStorage.removeItem('accessToken'); } catch {}
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
