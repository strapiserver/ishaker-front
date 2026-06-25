import { configureStore } from "@reduxjs/toolkit";
import strapiReducer from "./strapiSlice";

const store = configureStore({
  reducer: {
    strapi: strapiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
