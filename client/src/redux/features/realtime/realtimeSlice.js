import { createSlice } from "@reduxjs/toolkit";

export const EventTypes = {
  // Sync
  SYNC_COMPLETED: "sync.completed",
  SYNC_FAILED: "sync.failed",
  // Academic
  ATTENDANCE_MARKED: "attendance.marked",
  EXAM_CREATED: "exam.created",
  RESULT_PUBLISHED: "result.published",
  // Payment
  FEE_PAID: "fee.paid",
  // Comms
  ANNOUNCEMENT_CREATED: "announcement.created",
  // Auth
  SESSION_EXPIRED: "auth.session_expired"
};

const initialState = {
  connectionStatus: "disconnected",
  lastEventTimestamp: null,
  pendingUpdates: []
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    setLastEventTimestamp: (state, action) => {
      state.lastEventTimestamp = action.payload;
    },
    addPendingUpdate: (state, action) => {
      state.pendingUpdates.push(action.payload);
    },
    resetRealtimeState: () => initialState
  }
});

export const {
  setConnectionStatus,
  setLastEventTimestamp,
  addPendingUpdate,
  resetRealtimeState
} = realtimeSlice.actions;

export const handleRealtimeEvent = (eventPayload) => (dispatch) => {
  const { type, data } = eventPayload;
  console.log(`[Realtime] Received ${type}:`, data);
  // We'll expand handlers as we build the React components
};

export default realtimeSlice.reducer;
