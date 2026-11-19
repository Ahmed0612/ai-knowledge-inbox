
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// Ask a question using RAG
export const askQuestion = createAsyncThunk(
  "query/askQuestion",
  async ({ question, topK = 5 }, { rejectWithValue }) => {
    try {
      const response = await api.post("/query", {
        question,
        topK,
      },
        {
          // Allow enough time for embedding retrieval and Ollama generation.
          timeout: 150000,
        });

      return response.data;
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        return rejectWithValue(
          "AI response timed out. Please try again."
        );
      }

      if (error.response) {
        return rejectWithValue(
          error.response.data?.message ||
          `Request failed with status ${error.response.status}`
        );
      }

      if (error.request) {
        return rejectWithValue(
          "Backend did not respond. Check whether the server is running."
        );
      }

      return rejectWithValue(
        error.message || "Unable to process your question."
      );
    }
  }
);

const initialState = {
  question: "",
  answer: null,
  sources: [],
  totalResults: 0,
  loading: false,
  error: null,
};

const querySlice = createSlice({
  name: "query",
  initialState,
  reducers: {
    clearQuery: (state) => {
      state.question = "";
      state.answer = null;
      state.sources = [];
      state.totalResults = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askQuestion.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.question = action.meta.arg.question;
        state.answer = null;
        state.sources = [];
        state.totalResults = 0;
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.question = action.payload.question;
        state.answer = action.payload.answer;
        state.sources = action.payload.sources || [];
        state.totalResults = action.payload.totalResults || 0;
      })
      .addCase(askQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to process your question.";
      });
  },
});

export const { clearQuery } = querySlice.actions;

export default querySlice.reducer;
