<!-- // $lib/components/SearchSuggestions.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    query: string;
    categories: Array<{ id: number; category: string }>;
    onSuggestionClick: (suggestion: string) => void;
    isVisible: boolean;
  }

  let { query, categories, onSuggestionClick, isVisible }: Props = $props();

  let searchHistory = $state<string[]>([]);
  let suggestionsContainer = $state<HTMLElement | null>(null);

  // Load search history from localStorage on mount
  onMount(() => {
    try {
      const stored = localStorage.getItem('searchHistory');
      if (stored) {
        searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
      searchHistory = [];
    }
  });

  // Generate suggestions based on query
  let suggestions = $derived(() => {
    if (!query.trim()) {
      return {
        history: searchHistory.slice(0, 5),
        categories: [],
        combined: searchHistory.slice(0, 5)
      };
    }

    const normalizedQuery = query.toLowerCase();
    
    // Filter history
    const filteredHistory = searchHistory
      .filter(item => item.toLowerCase().includes(normalizedQuery))
      .slice(0, 3);
    
    // Filter categories
    const filteredCategories = categories
      .filter(cat => cat.category.toLowerCase().includes(normalizedQuery))
      .map(cat => cat.category)
      .slice(0, 3);
    
    // Combine and deduplicate
    const combined = [
      ...filteredHistory,
      ...filteredCategories
    ].filter((item, index, arr) => arr.indexOf(item) === index);

    return {
      history: filteredHistory,
      categories: filteredCategories,
      combined: combined.slice(0, 5)
    };
  });

  function handleSuggestionClick(suggestion: string) {
    onSuggestionClick(suggestion);
  }

  function handleKeydown(e: KeyboardEvent, suggestion: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSuggestionClick(suggestion);
    }
  }

  function getSuggestionType(suggestion: string): 'history' | 'category' {
    return searchHistory.includes(suggestion) ? 'history' : 'category';
  }
</script>

