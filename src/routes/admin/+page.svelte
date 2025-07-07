<script>
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import Dialog from '$lib/components/Dialog.svelte';
  import PortfolioForm from '$lib/components/PortfolioForm.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import EnhancedSearchInput from '$lib/components/EnhancedSearchInput.svelte';
  import SearchHighlight from '$lib/components/SearchHighlight.svelte';
  import { FuzzySearch } from '$lib/utils/fuzzySearch';
  import { debounce } from '$lib/utils/debounce';

  let allPortfolios = $state([]); // Store all portfolios for fuzzy search
  let displayedPortfolios = $state([]); // Currently displayed portfolios
  let categories = $state([]);
  let loading = $state(true);
  let searchLoading = $state(false);
  let currentPage = $state(1);
  let totalPages = $state(0);
  let selectedCategory = $state('');
  let searchQuery = $state('');
  let dateFrom = $state('');
  let dateTo = $state('');
  let fuzzySearchEngine = $state(null);
  let searchScore = $state(null);
  
  let { data } = $props();

  // pagination component
  const ITEMS_PER_PAGE = 4;
  
  // Reactive computed values for button states
  let isSearchDisabled = $derived(!searchQuery.trim() && !selectedCategory && !dateFrom && !dateTo);
  let isResetDisabled = $derived(!searchQuery.trim() && !selectedCategory && !dateFrom && !dateTo);
  let hasActiveFilters = $derived(searchQuery.trim() || selectedCategory || dateFrom || dateTo);
  
  // Initialize fuzzy search engine
  function initializeFuzzySearch() {
    if (allPortfolios.length > 0) {
      fuzzySearchEngine = new FuzzySearch(allPortfolios, {
        threshold: 0.4,
        // keys: ['title', 'description', 'tags', 'user.name', 'category.category'],
        keys: ['title', 'tags', 'user.name', 'category.category'],
        includeScore: true,
        shouldSort: true,
        tokenize: true,
        minMatchCharLength: 2
      });
    }
  }
  
  async function fetchAllPortfolios() {
    loading = true;
    try {
      // Fetch all portfolios without pagination for fuzzy search
      const response = await fetch('/api/portfolio?limit=1000');
      if (response.ok) {
        const result = await response.json();
        allPortfolios = result.portfolios || [];
        
        // Initialize fuzzy search engine
        initializeFuzzySearch();
        
        // Apply initial filters
        applyFilters();
      } else {
        console.error('Failed to fetch portfolios:', await response.text());
        allPortfolios = [];
        displayedPortfolios = [];
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      allPortfolios = [];
      displayedPortfolios = [];
    } finally {
      loading = false;
    }
  }
  
  async function fetchCategories() {
    try {
      // Try the categories endpoint first
      let response = await fetch('/api/portfolio/categories');
      
      // If that fails, try getting categories from the main endpoint
      if (!response.ok) {
        console.log('Categories endpoint failed, trying alternative method');
        response = await fetch('/api/portfolio?categories=true');
      }
      
      if (response.ok) {
        const result = await response.json();
        categories = result.categories || [];
      } else {
        console.error('Failed to fetch categories:', await response.text());
        categories = [];
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      categories = [];
    }
  }
  
  function applyFilters() {
    let filteredPortfolios = [...allPortfolios];
    searchScore = null;
    
    // Apply search filter using fuzzy search
    if (searchQuery.trim() && fuzzySearchEngine) {
      const searchResults = fuzzySearchEngine.search(searchQuery);
      filteredPortfolios = searchResults.map(result => result.item);
      
      // Store the best search score
      if (searchResults.length > 0) {
        searchScore = searchResults[0].score;
      }
    }
    
    // Apply category filter
    if (selectedCategory) {
      filteredPortfolios = filteredPortfolios.filter(portfolio => 
        portfolio.category?.category === selectedCategory
      );
    }
    
    // Apply date filters
    if (dateFrom || dateTo) {
      filteredPortfolios = filteredPortfolios.filter(portfolio => {
        const portfolioDate = new Date(portfolio.createdAt);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && portfolioDate < fromDate) return false;
        if (toDate && portfolioDate > toDate) return false;
        return true;
      });
    }
    
    // Calculate pagination
    totalPages = Math.ceil(filteredPortfolios.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    displayedPortfolios = filteredPortfolios.slice(startIndex, endIndex);
  }
  
  function getSearchScoreLabel(score) {
    if (score >= 0.9) return 'Perfect match';
    if (score >= 0.7) return 'Excellent match';
    if (score >= 0.5) return 'Good match';
    if (score >= 0.3) return 'Fair match';
    return 'Weak match';
  }
  
  // Debounced search function for real-time search
  const debouncedSearch = debounce((query) => {
    searchLoading = true;
    currentPage = 1;
    
    // Use setTimeout to simulate async operation and show loading state
    setTimeout(() => {
      applyFilters();
      searchLoading = false;
    }, 100);
  }, 300);
  
  function handlePageChange(page) {
    currentPage = page;
    applyFilters();
  }
  
  function handleCategoryChange() {
    currentPage = 1;
    applyFilters();
  }
  
  function handleDateChange() {
    currentPage = 1;
    applyFilters();
  }
  
  function handleSearchInput(query) {
    searchQuery = query;
    debouncedSearch(query);
  }
  
  function handleSearch(query) {
    searchQuery = query;
    currentPage = 1;
    applyFilters();
  }
  
  function handleReset() {
    if (isResetDisabled) return;
    searchQuery = '';
    selectedCategory = '';
    dateFrom = '';
    dateTo = '';
    currentPage = 1;
    applyFilters();
  }

  onMount(() => {
    fetchAllPortfolios();
    fetchCategories();
  });
  
  // Dialog state
  let portfolioDialog = $state(false);
  let deleteDialog = $state(false);
  
  // Portfolio state
  let currentPortfolio = $state(null);
  let deletingPortfolio = $state(null);
  let portfolioMode = $state('create'); // 'create', 'edit', or 'view'
  
  // Form state
  let formChanges = $state(false);
  let formDisabled = $state(true);
  
  function openCreateDialog() {
    currentPortfolio = null;
    portfolioMode = 'create';
    portfolioDialog = true;
  }
  
  function openEditDialog(portfolio) {
    // Transform the portfolio data to match form field names
    currentPortfolio = {
      ...portfolio,
      url: portfolio.projectUrl // Map projectUrl to url for form compatibility
    };
    portfolioMode = 'edit';
    portfolioDialog = true;
  }
  
  function openViewDialog(portfolio) {
    // Transform the portfolio data to match form field names
    currentPortfolio = {
      ...portfolio,
      url: portfolio.projectUrl // Map projectUrl to url for form compatibility
    };
    portfolioMode = 'view';
    portfolioDialog = true;
  }
  
  function openDeleteDialog(portfolio) {
    deletingPortfolio = portfolio;
    deleteDialog = true;
  }
  
  function closeDialogs() {
    portfolioDialog = false;
    deleteDialog = false;
    currentPortfolio = null;
    deletingPortfolio = null;
    formChanges = false;
    formDisabled = true;
    portfolioMode = 'create';
  }
  
  function handleEditFromView(portfolio) {
    // Switch from view mode to edit mode
    portfolioMode = 'edit';
    currentPortfolio = portfolio;
  }
  
  async function handleCreateSubmit(formData, formDataObj) {
    const response = await fetch('?/create', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      closeDialogs();
      await invalidateAll();
      await fetchAllPortfolios(); // Refresh all portfolios for search
      toast.success('Portfolio created successfully!');
    } else {
      toast.error('Failed to create portfolio. Please try again.');
    }
  }
  
  async function handleEditSubmit(formData, formDataObj) {
    // Add the portfolio ID to the form data for the update operation
    if (currentPortfolio && currentPortfolio.id) {
      formData.append('id', currentPortfolio.id);
    }
    
    const response = await fetch('?/update', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      closeDialogs();
      await invalidateAll();
      await fetchAllPortfolios(); // Refresh all portfolios for search
      toast.success('Portfolio updated successfully!');
    } else {
      const errorText = await response.text();
      console.error('Failed to update portfolio:', errorText);
      toast.error('Failed to update portfolio. Please try again.');
    }
  }
  
  function handlePortfolioSubmit(formData, formDataObj) {
    if (portfolioMode === 'create') {
      return handleCreateSubmit(formData, formDataObj);
    } else if (portfolioMode === 'edit') {
      return handleEditSubmit(formData, formDataObj);
    }
  }
  
  // Helper functions to safely access nested properties
  function getCategoryName(portfolio) {
    return portfolio?.category?.category || 'Uncategorized';
  }
  
  function getUserName(portfolio) {
    return portfolio?.user?.name || 'Unknown User';
  }
  
  function getProjectUrl(portfolio) {
    return portfolio?.projectUrl || null;
  }
  
  function getPortfolioTags(portfolio) {
    if (!portfolio?.tags) return [];
    try {
      return JSON.parse(portfolio.tags);
    } catch {
      return [];
    }
  }
  
  // Computed properties for dialog title
  let dialogTitle = $derived(
    portfolioMode === 'create' ? 'Add New Portfolio' :
    portfolioMode === 'edit' ? 'Edit Portfolio' :
    'Portfolio Details'
  );
</script>

<svelte:head>
  <title>Admin - Portfolio Management</title>
</svelte:head>

<div class="admin-page">
  <div class="admin-header">
    <h1>Portfolio Management</h1>
    <button class="button primary" onclick={openCreateDialog}>
      <span class="button-icon">+</span>
      Add New Portfolio
    </button>
  </div>
  
  <!-- Enhanced Search Input -->
  <div class="search-section">
    <EnhancedSearchInput
      placeholder="Search portfolios... (intelligent fuzzy search enabled)"
      categories={categories}
      onSearch={handleSearch}
      onInput={handleSearchInput}
      className="portfolio-search"
      value={searchQuery}
    />
    
  </div>
  
  <!-- Additional Filter Controls -->
  <div class="filter-controls">
    <div class="filter-group">
      <label for="category-select" class="filter-label">Category:</label>
      <select 
        id="category-select" 
        bind:value={selectedCategory} 
        onchange={handleCategoryChange} 
        class="filter-select"
      >
        <option value="">All Categories</option>
        {#each categories as category}
          <option value={category.category}>{category.category}</option>
        {/each}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="date-from" class="filter-label">From:</label>
      <input
        id="date-from"
        type="date"
        bind:value={dateFrom}
        onchange={handleDateChange}
        class="filter-input"
      />
    </div>
    
    <div class="filter-group">
      <label for="date-to" class="filter-label">To:</label>
      <input
        id="date-to"
        type="date"
        bind:value={dateTo}
        onchange={handleDateChange}
        class="filter-input"
      />
    </div>
    
    <div class="filter-actions">
      <button 
        class="button secondary" 
        onclick={handleReset} 
        disabled={isResetDisabled}
      >
        <span class="button-icon">↻</span>
        Reset Filters
      </button>
    </div>
  </div>
  
  <!-- Content -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading portfolios...</p>
    </div>
  {:else if displayedPortfolios.length === 0}
    <div class="empty-state">
      <div class="empty-state-icon">
        {#if hasActiveFilters}
          🔍
        {:else}
          📂
        {/if}
      </div>
      <h3>
        {#if hasActiveFilters}
          No portfolios match your criteria
        {:else}
          No portfolios found
        {/if}
      </h3>
      <p>
        {#if hasActiveFilters}
          Try adjusting your search criteria or filters.
        {:else}
          Create your first portfolio to get started!
        {/if}
      </p>
      
      {#if searchQuery.trim()}
        <div class="search-tip">
          <strong>💡 Search Tips:</strong>
          <ul>
            <li>Our fuzzy search handles typos and partial matches</li>
            <li>Try using different keywords or shorter terms</li>
            <li>Search works across titles, descriptions, tags, authors, and categories</li>
            <li>Use multiple words for better results</li>
          </ul>
        </div>
      {/if}
      
      {#if hasActiveFilters}
        <!-- <button class="button secondary" onclick={handleReset}> -->
        <!--   <span class="button-icon">↻</span> -->
        <!--   Clear All Filters -->
        <!-- </button> -->
      {/if}
    </div>
  {:else}
    <div class="portfolios-grid">
      {#each displayedPortfolios as portfolio}
        <div class="portfolio-card">
          <div class="portfolio-header">
            <h3 class="portfolio-title">
              <SearchHighlight 
                text={portfolio.title} 
                searchQuery={searchQuery}
              />
            </h3>
            <div class="portfolio-meta">
              <span class="portfolio-category">
                {#if getCategoryName(portfolio) !== 'Uncategorized'}
                  <SearchHighlight 
                    text={getCategoryName(portfolio)} 
                    searchQuery={searchQuery}
                    className="category-badge"
                  />
                {:else}
                  <span class="category-badge muted">Uncategorized</span>
                {/if}
              </span>
              <span class="portfolio-author">
                by <SearchHighlight 
                  text={getUserName(portfolio)} 
                  searchQuery={searchQuery}
                />
              </span>
            </div>
          </div>
          
          <div class="portfolio-content">
            {#if portfolio.imageUrl}
              <div class="portfolio-image">
                <img src={portfolio.imageUrl} alt={portfolio.title} />
              </div>
            {/if}
            
            <div class="portfolio-description">
              <SearchHighlight 
                text={portfolio.description.substring(0, 150)} 
                searchQuery={searchQuery}
              />
              {#if portfolio.description.length > 150}...{/if}
            </div>
          </div>
          
          <div class="portfolio-actions">
            {#if getProjectUrl(portfolio)}
              <a 
                href={getProjectUrl(portfolio)} 
                target="_blank" 
                rel="noopener noreferrer" 
                class="button secondary small"
              >
                View Project
              </a>
            {/if}
            <button 
              class="button secondary small" 
              onclick={() => openViewDialog(portfolio)}
            >
              Details
            </button>
            <button 
              class="button primary small" 
              onclick={() => openEditDialog(portfolio)}
            >
              Edit
            </button>
            <button 
              class="button danger small" 
              onclick={() => openDeleteDialog(portfolio)}
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if totalPages > 1}
      <div class="pagination-wrapper">
        <Pagination
          {currentPage}
          {totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    {/if}
  {/if}


    {#if searchQuery.trim() && fuzzySearchEngine}
      <div class="search-insights">
        <div class="search-stats">
          <span class="stat">
            <strong>Search Algorithm:</strong> Fuzzy matching with tokenization
          </span>
          <span class="stat">
            <strong>Match Threshold:</strong> 40% similarity
          </span>
          {#if searchScore !== null}
            <span class="stat">
              <strong>Best Match Score:</strong> 
              <span class="score-badge score-{Math.floor(searchScore * 10)}">
                {(searchScore * 100).toFixed(1)}%
              </span>
              <span class="score-label">({getSearchScoreLabel(searchScore)})</span>
            </span>
          {/if}
        </div>
        <div class="search-tips">
          <strong>💡 Tips:</strong> 
          Search works with partial words, typos, and multiple terms. 
          Try searching by title, description, tags, author, or category.
        </div>
      </div>
    {/if}
</div>

<!-- Portfolio Dialog (Create/Edit/View) -->
<Dialog title={dialogTitle} bind:isOpen={portfolioDialog} onClose={closeDialogs}>
  <PortfolioForm
    mode={portfolioMode}
    portfolio={currentPortfolio}
    users={data.user}
    categories={data.categories}
    onSubmit={handlePortfolioSubmit}
    onCancel={closeDialogs}
    onEdit={handleEditFromView}
    bind:hasChanges={formChanges}
    bind:submitDisabled={formDisabled}
  />
</Dialog>

<!-- Delete Portfolio Dialog -->
<Dialog title="Delete Portfolio" bind:isOpen={deleteDialog} onClose={closeDialogs}>
  {#if deletingPortfolio}
    <div class="delete-confirmation">
      <p>Are you sure you want to delete "<strong>{deletingPortfolio.title}</strong>"?</p>
      <p class="warning-text">This action cannot be undone.</p>
    </div>
    
    <form method="POST" action="?/delete" use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          closeDialogs();
          await invalidateAll();
          await fetchAllPortfolios(); // Refresh all portfolios for search
          toast.success('Portfolio deleted successfully!');
        } else if (result.type === 'failure') {
          toast.error('Failed to delete portfolio. Please try again.');
        }
      };
    }}>
      <input type="hidden" name="id" value={deletingPortfolio.id} />
      
      <div class="dialog-actions">
        <button type="button" class="button secondary" onclick={closeDialogs}>
          Cancel
        </button>
        <button type="submit" class="button danger">
          Delete Portfolio
        </button>
      </div>
    </form>
  {/if}
</Dialog>

<style>

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .admin-header h1 {
    margin: 0;
    color: #333;
  }

  .search-section {
    margin-bottom: 1.5rem;
  }

  .search-section :global(.portfolio-search) {
    max-width: 600px;
  }

  .search-insights {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .search-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .stat {
    font-size: 0.875rem;
    color: #666;
  }

  .score-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
  }

  .score-badge.score-0,
  .score-badge.score-1,
  .score-badge.score-2,
  .score-badge.score-3 {
    background: #ffebee;
    color: #c62828;
  }

  .score-badge.score-4,
  .score-badge.score-5 {
    background: #fff3e0;
    color: #ef6c00;
  }

  .score-badge.score-6,
  .score-badge.score-7 {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  .score-badge.score-8,
  .score-badge.score-9,
  .score-badge.score-10 {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .score-label {
    font-size: 0.75rem;
    color: #888;
    margin-left: 0.5rem;
  }

  .search-tips {
    font-size: 0.875rem;
  }

  .filter-controls {
    display: flex;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #555;
  }

  .filter-select,
  .filter-input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .filter-select {
    min-width: 150px;
  }

  .filter-actions {
    display: flex;
    gap: 0.5rem;
  }

  .loading-state {
    text-align: center;
    padding: 3rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #1976d2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .empty-state-icon {
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }

  .search-tip {
    margin-top: 1rem;
    padding: 1rem;
    background: #e3f2fd;
    border-radius: 6px;
    color: #1976d2;
    font-size: 0.875rem;
    text-align: left;
  }

  .search-tip ul {
    margin: 0.5rem 0 0 1rem;
  }

  .portfolios-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .portfolio-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .portfolio-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .portfolio-header {
    margin-bottom: 1rem;
  }

  .portfolio-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #333;
  }

  .portfolio-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #666;
  }

  .portfolio-category :global(.category-badge) {
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .portfolio-category .category-badge.muted {
    background: #f5f5f5;
    color: #999;
  }

  .portfolio-image {
    margin-bottom: 1rem;
  }

  .portfolio-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
  }

  .portfolio-description {
    margin-bottom: 1rem;
    color: #666;
    line-height: 1.5;
  }

  .portfolio-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .button.small {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }

  .button.primary {
    background: #1976d2;
    color: white;
  }

  .button.primary:hover {
    background: #1565c0;
  }

  .button.secondary {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
  }

  .button.secondary:hover {
    background: #e0e0e0;
  }

  .button.danger {
    background: #d32f2f;
    color: white;
  }

  .button.danger:hover {
    background: #c62828;
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-icon {
    margin-right: 0.5rem;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }

  .delete-confirmation {
    margin-bottom: 1.5rem;
  }

  .warning-text {
    color: #d32f2f;
    font-weight: 500;
  }

  .dialog-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  @media (max-width: 768px) {
    .admin-page {
      padding: 1rem;
    }

    .admin-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .filter-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .portfolios-grid {
      grid-template-columns: 1fr;
    }

    .portfolio-actions {
      flex-direction: column;
    }

    .search-stats {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
