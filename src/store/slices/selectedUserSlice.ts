import { createSlice } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "selectedUser",
  storage,
};

const initialState = {
  user: null,
};

const selectedUserSlice = createSlice({
  name: "selectedUser",
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.user = action.payload;
    },
    clearSelectedUser: (state) => {
      state.user = null;
    },
  },
});

export const { setSelectedUser, clearSelectedUser } = selectedUserSlice.actions;

export default persistReducer(persistConfig, selectedUserSlice.reducer);
