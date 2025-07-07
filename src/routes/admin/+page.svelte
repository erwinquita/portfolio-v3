<script>
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import Dialog from '$lib/components/Dialog.svelte';
  import PortfolioForm from '$lib/components/PortfolioForm.svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  let portfolios = $state([]);
  let categories = $state([]);
  let loading = $state(true);
  let currentPage = $state(1);
  let totalPages = $state(0);
  let selectedCategory = $state('');
  let searchQuery = $state('');
  let dateFrom = $state('');
  let dateTo = $state('');
  
  let { data } = $props();

  // pagination component
  const ITEMS_PER_PAGE = 4;
  
  // Reactive computed values for button states
  let isSearchDisabled = $derived(!searchQuery.trim() && !selectedCategory && !dateFrom && !dateTo);
  let isResetDisabled = $derived(!searchQuery.trim() && !selectedCategory && !dateFrom && !dateTo);
  
  async function fetchPortfolios() {
    loading = true;
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(dateFrom && { dateFrom: dateFrom }),
        ...(dateTo && { dateTo: dateTo })
      });
      
      const response = await fetch(`/api/portfolio?${params}`);
      if (response.ok) {
        const data = await response.json();
        portfolios = data.portfolios || [];
        totalPages = data.totalPages || 0;
      } else {
        console.error('Failed to fetch portfolios:', await response.text());
        portfolios = [];
        totalPages = 0;
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      portfolios = [];
      totalPages = 0;
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
        const data = await response.json();
        categories = data.categories || [];
      } else {
        console.error('Failed to fetch categories:', await response.text());
        categories = [];
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      categories = [];
    }
  }
  
  function handlePageChange(page) {
    currentPage = page;
    fetchPortfolios();
  }
  
  function handleCategoryChange() {
    currentPage = 1;
    fetchPortfolios();
  }
  
  function handleSearch() {
    if (isSearchDisabled) return;
    currentPage = 1;
    fetchPortfolios();
  }
  
  function handleReset() {
    if (isResetDisabled) return;
    searchQuery = '';
    selectedCategory = '';
    dateFrom = '';
    dateTo = '';
    currentPage = 1;
    fetchPortfolios();
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  onMount(() => {
    fetchPortfolios();
    fetchCategories();
  });
  // end pagination
  
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
      await fetchPortfolios(); // Refresh the local portfolios state
      toast.success('Portfolio created successfully!');
    } else {
      toast.error('Failed to create portfolio. Please try again.');
    }
  }
  
  async function handleEditSubmit(formData, formDataObj) {
    const response = await fetch('?/update', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      closeDialogs();
      await invalidateAll();
      await fetchPortfolios(); // Refresh the local portfolios state
      toast.success('Portfolio updated successfully!');
    } else {
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
    <button class="button" onclick={openCreateDialog}>Add New Portfolio</button>
  </div>
  
  <!-- Search and Filter Controls -->
  <div class="search-controls">
    <div class="search-group">
      <div class="input-group">
        <label for="search-input" class="visually-hidden">Search portfolios</label>
        <input
          id="search-input"
          type="text"
          placeholder="Search portfolios..."
          bind:value={searchQuery}
          onkeydown={handleKeydown}
          class="search-input"
        />
      </div>
      <div class="input-group">
        <label for="category-select" class="visually-hidden">Filter by category</label>
        <select id="category-select" bind:value={selectedCategory} onchange={handleCategoryChange} class="category-select">
          <option value="">All Categories</option>
          {#each categories as category}
            <option value={category.category}>{category.category}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="date-range-group">
      <div class="input-group">
        <label for="date-from" class="date-label">From:</label>
        <input
          id="date-from"
          type="date"
          bind:value={dateFrom}
          class="date-input"
        />
      </div>
      <div class="input-group">
        <label for="date-to" class="date-label">To:</label>
        <input
          id="date-to"
          type="date"
          bind:value={dateTo}
          class="date-input"
        />
      </div>
    </div>
    
    <div class="search-buttons">
      <button class="button secondary" onclick={handleSearch} disabled={isSearchDisabled}>
        Search
      </button>
      <button class="button secondary" onclick={handleReset} disabled={isResetDisabled}>
        Reset
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="loading">Loading portfolios...</div>
  {:else if portfolios.length === 0}
    <p>No portfolios found. {searchQuery || selectedCategory || dateFrom || dateTo ? 'Try adjusting your search criteria.' : 'Create your first portfolio to get started!'}</p>
  {:else}
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Creator</th>
          <th>URL</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each portfolios as portfolio}
          <tr>
            <td>{portfolio.title}</td>
            <td>
              {#if getCategoryName(portfolio) !== 'Uncategorized'}
                <span class="category-badge">{getCategoryName(portfolio)}</span>
              {:else}
                <span class="text-muted">Uncategorized</span>
              {/if}
            </td>
            <td>
              {#if getUserName(portfolio) !== 'Unknown User'}
                <span class="user-name">{getUserName(portfolio)}</span>
              {:else}
                <span class="text-muted">Unknown User</span>
              {/if}
            </td>
            <td>
              {#if getProjectUrl(portfolio)}
                <a href={getProjectUrl(portfolio)} target="_blank" rel="noopener noreferrer" class="external-link">
                  View Url
                </a>
              {:else}
                <span class="text-muted">No URL</span>
              {/if}
            </td>
            <td class="table-actions">
              <button class="button secondary" onclick={() => openViewDialog(portfolio)}>View Details</button>
              <button class="button secondary" onclick={() => openEditDialog(portfolio)}>Edit</button>
              <button class="button danger" onclick={() => openDeleteDialog(portfolio)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if totalPages > 1}
      <Pagination
        {currentPage}
        {totalPages}
        onPageChange={handlePageChange}
      />
    {/if}
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
    <p>Are you sure you want to delete "<strong>{deletingPortfolio.title}</strong>"?</p>
    <p>This action cannot be undone.</p>
    
    <form method="POST" action="?/delete" use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          closeDialogs();
          await invalidateAll();
          await fetchPortfolios(); // Refresh the local portfolios state
          toast.success('Portfolio deleted successfully!');
        } else if (result.type === 'failure') {
          toast.error('Failed to delete portfolio. Please try again.');
        }
      };
    }}>
      <input type="hidden" name="id" value={deletingPortfolio.id} />
      
      <div class="dialog-actions">
        <button type="button" class="button secondary" onclick={closeDialogs}>Cancel</button>
        <button type="submit" class="button danger">Delete Portfolio</button>
      </div>
    </form>
  {/if}
</Dialog>

<style>
  .search-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }
  
  .search-group {
    display: flex;
    gap: 0.5rem;
    flex: 1;
    min-width: 300px;
  }
  
  .date-range-group {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .search-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .category-select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 150px;
  }
  
  .date-input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 140px;
  }
  
  .date-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }
  
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .search-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .text-muted {
    color: #999;
    font-style: italic;
  }
  
  .category-badge {
    background-color: #e3f2fd;
    color: #1976d2;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .search-controls {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-group {
      min-width: auto;
      flex-direction: column;
    }
    
    .date-range-group {
      justify-content: center;
    }
    
    .search-buttons {
      justify-content: center;
    }
  }
</style>
