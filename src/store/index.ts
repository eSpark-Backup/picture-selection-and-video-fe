import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import imagesReducer from "./slices/image/imageSlice";
import selectedUserReducer from "./slices/selectedUserSlice"; 

import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import selectedImageSlice from "./slices/selectedImageSlice";

const persistImagesConfig = {
  key: "reviewer",
  storage,
};

const persistedImagesReducer = persistReducer(
  persistImagesConfig,
  imagesReducer
);

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    reviewer: persistedImagesReducer,
    selectedUser: selectedUserReducer,
    selectedImage: selectedImageSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
