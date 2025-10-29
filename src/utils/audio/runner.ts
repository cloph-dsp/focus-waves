import { delay, stopAllSorting } from "./engine";
import { loadSortingGenerator } from "./registry";
import type { SortingRunOptions } from "./types";

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Sorting run aborted", "AbortError");
  }

  const error = new Error("Sorting run aborted");
  error.name = "AbortError";
  return error;
};

export const runSortingGenerator = async ({
  id,
  size = 64,
  visualCallback,
  loop = true,
  signal,
}: SortingRunOptions): Promise<void> => {
  if (signal?.aborted) {
    throw createAbortError();
  }

  stopAllSorting();
  await delay(20);

  if (signal?.aborted) {
    throw createAbortError();
  }

  const generator = await loadSortingGenerator(id);

  const abortHandler = () => {
    stopAllSorting();
  };

  signal?.addEventListener("abort", abortHandler);

  try {
    await generator(size, visualCallback, loop);

    if (signal?.aborted) {
      throw createAbortError();
    }
  } catch (error) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    throw error;
  } finally {
    signal?.removeEventListener("abort", abortHandler);

    if (!signal || !signal.aborted) {
      stopAllSorting();
    }
  }
};
