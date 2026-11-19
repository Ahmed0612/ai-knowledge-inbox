
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// Save a note or URL
export const ingestItem = createAsyncThunk(
  "items/ingestItem",
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await api.post("http://localhost:5000/api/ingest", itemData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to save content."
      );
    }
  }
);

// Retrieve saved knowledge
export const fetchItems = createAsyncThunk(
  "items/fetchItems",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/ingest", {
        params: { page, limit },
      });

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to retrieve saved items."
      );
    }
  }
);

const initialState = {
  items: [],
  pagination: {
    currentPage: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },
  loading: false,
  ingestionLoading: false,
  error: null,
  ingestionError: null,
};

const itemSlice = createSlice({
  name: "items",
  initialState,
  reducers: {
    clearItemErrors: (state) => {
      state.error = null;
      state.ingestionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch items
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong.";
      })

      // Ingest item
      .addCase(ingestItem.pending, (state) => {
        state.ingestionLoading = true;
        state.ingestionError = null;
      })
      .addCase(ingestItem.fulfilled, (state, action) => {
        state.ingestionLoading = false;

        const newItem = action.payload;

        // Avoid duplicate records if the same item is already present.
        state.items = state.items.filter(
          (item) => item._id !== newItem.itemId
        );

        state.items.unshift({
          _id: newItem.itemId,
          title: newItem.title,
          type: newItem.type,
          sourceUrl: newItem.sourceUrl || null,
          status: newItem.status,
          createdAt: newItem.createdAt,
        });

        state.pagination.totalItems += 1;
      })
      .addCase(ingestItem.rejected, (state, action) => {
        state.ingestionLoading = false;
        state.ingestionError =
          action.payload || "Unable to save content.";
      });
  },
});

export const { clearItemErrors } = itemSlice.actions;

export default itemSlice.reducer;
