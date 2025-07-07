<!-- // $lib/components/EnhancedSearchInput.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { addToHistory } from '$lib/stores/search';
  import { debounce } from '$lib/utils/debounce';
  import SearchSuggestions from './SearchSuggestions.svelte';

  interface Props {
    placeholder?: string;
    categories?: Array<{ id: number; category: string }>;
    onSearch?: (query: string) => void;
    onInput?: (query: string) => void;
    className?: string;
    value?: string;
  }

  let { 
    placeholder = 'Search...', 
    categories = [], 
    onSearch, 
    onInput, 
    className = '',
    value = '' 
  }: Props = $props();

  let searchInput = $state<HTMLInputElement | null>(null);
  let searchQuery = $state(value);
  let isSearchFocused = $state(false);
  let showSuggestions = $state(false);
  let searchContainer = $state<HTMLDivElement | null>(null);

  // Debounced input handler
  const debouncedInput = debounce((query: string) => {
    if (onInput) {
      onInput(query);
    }
  }, 300);

  // Handle input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    debouncedInput(searchQuery);
  }

  // Handle search submission
  function handleSearch() {
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      if (onSearch) {
        onSearch(searchQuery.trim());
      }
      showSuggestions = false;
      searchInput?.blur();
    }
  }

  // Handle search form submission
  function handleSubmit(event: Event) {
    event.preventDefault();
    handleSearch();
  }

  // Handle focus events
  function handleFocus() {
    isSearchFocused = true;
    showSuggestions = true;
  }

  function handleBlur() {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      isSearchFocused = false;
      showSuggestions = false;
    }, 200);
  }

  // Handle suggestion clicks
  function handleSuggestionClick(suggestion: string) {
    searchQuery = suggestion;
    addToHistory(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    }
    showSuggestions = false;
    searchInput?.blur();
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showSuggestions = false;
      searchInput?.blur();
    }
  }

  // Click outside handler
  onMount(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        showSuggestions = false;
        isSearchFocused = false;
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  // Update search query when value prop changes
  $effect(() => {
    searchQuery = value;
  });
</script>

<div class="search-container {className}" bind:this={searchContainer}>
  <form class="search-form" onsubmit={handleSubmit}>
    <div class="search-input-wrapper">
      <input
        bind:this={searchInput}
        type="text"
        class="search-input"
        class:focused={isSearchFocused}
        {placeholder}
        bind:value={searchQuery}
        oninput={handleInput}
        onfocus={handleFocus}
        onblur={handleBlur}
        onkeydown={handleKeydown}
        autocomplete="off"
        spellcheck="false"
      />
      
      <div class="search-actions">
        {#if searchQuery.trim()}
          <button
            type="button"
            class="clear-button"
            onclick={() => {
              searchQuery = '';
              if (onInput) onInput('');
              searchInput?.focus();
            }}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        {/if}
        
        <button
          type="submit"
          class="search-button"
          disabled={!searchQuery.trim()}
          aria-label="Search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Search Suggestions -->
    <SearchSuggestions
      query={searchQuery}
      {categories}
      onSuggestionClick={handleSuggestionClick}
      isVisible={showSuggestions}
    />
  </form>
</div>

<style>
  .search-container {
    position: relative;
    width: 100%;
    max-width: 500px;
  }

  .search-form {
    position: relative;
    width: 100%;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .search-input-wrapper:hover {
    border-color: #bdbdbd;
  }

  .search-input-wrapper:focus-within {
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }

  .search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    font-size: 1rem;
    color: #333;
    outline: none;
  }

  .search-input::placeholder {
    color: #999;
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding-right: 0.5rem;
  }

  .clear-button,
  .search-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: #666;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .clear-button:hover {
    background: #f5f5f5;
    color: #333;
  }

  .search-button {
    color: #1976d2;
  }

  .search-button:hover:not(:disabled) {
    background: #e3f2fd;
    color: #1565c0;
  }

  .search-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .search-container {
      max-width: 100%;
    }
    
    .search-input {
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
    }
  }
</style>
