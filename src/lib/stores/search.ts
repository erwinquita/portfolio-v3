// $lib/stores/search.ts
import { writable } from 'svelte/store';

interface SearchStore {
  history: string[];
  recentQueries: string[];
  maxHistorySize: number;
}

const defaultSearchStore: SearchStore = {
  history: [],
  recentQueries: [],
  maxHistorySize: 10
};

// Create writable store for search history
const searchHistoryStore = writable<string[]>([]);

// Create a store for the entire search state
const searchStore = writable<SearchStore>(defaultSearchStore);

// Helper functions for managing search history
const addToHistory = (query: string) => {
  if (!query.trim()) return;
  
  searchHistoryStore.update(history => {
    const filteredHistory = history.filter(item => item !== query);
    const newHistory = [query, ...filteredHistory].slice(0, defaultSearchStore.maxHistorySize);
    return newHistory;
  });
};

const clearHistory = () => {
  searchHistoryStore.set([]);
};

const getHistory = () => {
  let currentHistory: string[] = [];
  searchHistoryStore.subscribe(history => {
    currentHistory = history;
  })();
  return currentHistory;
};

// Export the store and utility functions
export {
  searchHistoryStore,
  searchStore,
  addToHistory,
  clearHistory,
  getHistory
};

// Export types
export type { SearchStore };
