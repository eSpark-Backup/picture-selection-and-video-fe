import { createSlice } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "selectedImage",
  storage,
};

const initialState = {
  image: {},
};

const selectedImageSlice = createSlice({
  name: "selectedImage",
  initialState,
  reducers: {
    setSelectedImage: (state, action) => {
      state.image = action.payload;
    },
    clearSelectedImage: (state) => {
      state.image = null;
    },
  },
});

export const { setSelectedImage, clearSelectedImage } =
  selectedImageSlice.actions;

export default persistReducer(persistConfig, selectedImageSlice.reducer);
