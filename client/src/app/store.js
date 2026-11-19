
import { configureStore } from "@reduxjs/toolkit";
import itemReducer from "../features/items/itemSlice";
import queryReducer from "../features/query/querySlice";

export const store = configureStore({
    reducer: {
        items: itemReducer,
        query: queryReducer,
    },
});
