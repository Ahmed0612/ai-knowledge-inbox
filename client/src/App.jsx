
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ingestItem, fetchItems } from "./features/items/itemSlice";
import { askQuestion } from "./features/query/querySlice";
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState("note");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [questionInput, setQuestionInput] = useState("");

  const dispatch = useDispatch();

const {
   items,
   loading,
   error,
  ingestionLoading,
  ingestionError,
} = useSelector((state) => state.items);

const {
  answer,
  sources,
  totalResults,
  loading: queryLoading,
  error: queryError,
} = useSelector((state) => state.query);

// Fetch saved knowledge whenever the application is mounted.
useEffect(() => {
  dispatch(fetchItems({ page: 1, limit: 10 }));
}, [dispatch]);

const handleAddKnowledge = async () => {
  const payload =
    activeTab === "note"
      ? {
          type: "note",
          title: "Untitled Note",
          content: note.trim(),
        }
      : {
          type: "url",
          content: url.trim(),
        };

  if (
    activeTab === "note" && !payload.content ||
    activeTab === "url" && !payload.content
  ) {
    return;
  }

  try {
    await dispatch(ingestItem(payload)).unwrap();

    setNote("");
    setUrl("");

    await dispatch(fetchItems({ page: 1, limit: 10 }));
  } catch (error) {
    console.error("Knowledge ingestion failed:", error);
  }
};

const handleAskQuestion = async () => {
  const question = questionInput.trim();

  if (!question || queryLoading) {
    return;
  }

  try {
    await dispatch(
      askQuestion({
        question,
        topK: 3,
      })
    ).unwrap();
  } catch (error) {
    console.error("Question processing failed:", error);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:flex md:flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              K
            </div>
            <div>
              <h1 className="text-lg font-bold">Knowledge Inbox</h1>
              <p className="text-xs text-slate-500">AI-powered workspace</p>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-2">
            <a
              href="#dashboard"
              className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
            >
              <span>▦</span> Dashboard
            </a>
            <a
              href="#saved-knowledge"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              <span>▤</span> Saved knowledge
            </a>
            <a
              href="#ask-ai"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              <span>✧</span> Ask AI
            </a>
          </nav>

          <div className="mt-auto rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold">Your knowledge space</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Save useful information and ask questions across your saved
              content.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main id="dashboard" className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div>
              <h2 className="text-lg font-bold">Dashboard</h2>
              <p className="text-xs text-slate-500">
                Your personal knowledge workspace
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              AI
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
            {/* Welcome */}
            <section>
              <p className="text-sm font-medium text-indigo-600">
                YOUR KNOWLEDGE WORKSPACE
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome to your Knowledge Inbox
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Save notes, collect useful webpages, and ask AI questions
                based on the knowledge you have stored.
              </p>
            </section>

            {/* Add knowledge */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5">
                <h2 className="text-lg font-bold">Add to your knowledge</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Start by saving a note or a webpage.
                </p>
              </div>

              <div className="mb-5 flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("note")}
                  className={`rounded-md px-5 py-2 text-sm font-medium transition ${
                    activeTab === "note"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Write a note
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`rounded-md px-5 py-2 text-sm font-medium transition ${
                    activeTab === "url"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Save a URL
                </button>
              </div>

              {activeTab === "note" ? (
                <div>
                  <label
                    htmlFor="note-content"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Note content
                  </label>
                  <textarea
                    id="note-content"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Write or paste your notes here..."
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="source-url"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Webpage URL
                  </label>
                  <input
                    id="source-url"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Saving and processing will be connected to the backend next.
                </p>
                <button
                  type="button"
                  onClick={handleAddKnowledge}
                  disabled={ingestionLoading}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                 {ingestionLoading ? "Saving..." : "Add to inbox"}
                </button>
              </div>
            </section>

            {/* Ask AI */}
            <section
              id="ask-ai"
              className="rounded-2xl bg-indigo-950 p-6 text-white shadow-sm sm:p-8"
            >
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-indigo-300">
                  AI KNOWLEDGE ASSISTANT
                </p>
                <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                  Ask questions about your knowledge
                </h2>
                <p className="mt-2 text-sm leading-6 text-indigo-200">
                  Get answers using information from your saved notes and
                  webpages, with relevant source references.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAskQuestion();
                      }
                    }}
                    disabled={queryLoading}
                    placeholder="Ask something about your saved knowledge..."
                    className="min-w-0 flex-1 rounded-lg border border-indigo-700 bg-indigo-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-indigo-300 focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleAskQuestion}
                    disabled={queryLoading || !questionInput.trim()}
                    className="rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {queryLoading ? "Thinking..." : "Ask AI"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-indigo-300">
                  Question answering will be enabled after frontend API
                  integration.
                </p>
              </div>
            </section>
            {/* AI Answer */}
            {(queryLoading || queryError || answer) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-bold text-slate-900">
                  AI Response
                </h2>

                {/* Loading */}
                {queryLoading && (
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="text-sm text-slate-500">
                      Searching your knowledge and generating an answer...
                    </p>
                  </div>
                )}

                {/* Error */}
                {!queryLoading && queryError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                      {queryError}
                    </p>
                  </div>
                )}

                {/* Answer */}
                {!queryLoading && answer && (
                  <>
                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        Answer
                      </p>

                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {answer}
                      </div>
                    </div>

                    {/* Sources */}
                    <div className="mt-7 border-t border-slate-200 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">
                          Retrieved sources
                        </h3>

                        <span className="text-xs text-slate-500">
                          {totalResults} relevant chunks retrieved
                        </span>
                      </div>

                      {sources.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {sources.map((source) => (
                            <article
                              key={source.chunkId}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  [{source.sourceNumber}] {source.title}
                                </h4>

                                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                                  {source.type}
                                </span>
                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {source.content}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                <span>
                                  Chunk: {source.chunkIndex}
                                </span>

                                <span>
                                  Similarity:{" "}
                                  {typeof source.similarity === "number"
                                    ? `${(source.similarity * 100).toFixed(1)}%`
                                    : "N/A"}
                                </span>
                              </div>

                              {source.sourceUrl && (
                                <a
                                  href={source.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 block break-all text-xs text-indigo-600 hover:underline"
                                >
                                  Open original webpage
                                </a>
                              )}
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No source chunks were returned.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Saved knowledge */}
            <section id="saved-knowledge">
              <div className="space-y-4">
                {/* Loading state */}
                {loading && (
                  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm text-slate-500">
                      Loading your saved knowledge...
                    </p>
                  </div>
                )}

                {/* Error state */}
                {!loading && error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <p className="text-sm text-red-600">{error}</p>

                    <button
                      type="button"
                      onClick={() =>
                        dispatch(fetchItems({ page: 1, limit: 10 }))
                      }
                      className="mt-3 text-sm font-semibold text-red-700 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!loading && !error && items.length === 0 && (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl text-slate-500">
                      ▤
                    </div>

                    <h3 className="mt-4 text-sm font-semibold">
                      Your inbox is empty
                    </h3>

                    <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                      Save your first note or webpage to see it here.
                    </p>
                  </div>
                )}

                {/* Actual saved items */}
                {!loading && !error && items.length > 0 && (
                  <div className="grid gap-4">
                    {items.map((item) => (
                      <article
                        key={item._id}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">
                                {item.type}
                              </span>

                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                                {item.status?.replaceAll("_", " ")}
                              </span>
                            </div>

                            <h3 className="break-words text-base font-semibold text-slate-900">
                              {item.title || "Untitled"}
                            </h3>

                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 block break-all text-sm text-indigo-600 hover:underline"
                              >
                                {item.sourceUrl}
                              </a>
                            )}

                            <p className="mt-3 text-xs text-slate-400">
                              Saved on{" "}
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleString()
                                : "Unknown date"}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
