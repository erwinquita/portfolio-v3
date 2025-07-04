<script>
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  
  let portfolios = $state([]);
  let categories = $state([]);
  let loading = $state(true);
  let currentPage = $state(1);
  let totalPages = $state(0);
  let selectedCategory = $state('');
  let searchQuery = $state('');

  let { data } = $props();
  
  
  const ITEMS_PER_PAGE = 6;
  
  async function fetchPortfolios() {
    loading = true;
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery })
      });
      
      const response = await fetch(`/api/portfolio?${params}`);
      if (response.ok) {
        const data = await response.json();
        portfolios = data.portfolios;
        totalPages = data.totalPages;
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      loading = false;
    }
  }
  
  async function fetchCategories() {
    try {
						let selectedCategory = $state('all');
      const response = await fetch('/api/portfolio/categories');
      if (response.ok) {
        const data = await response.json();
        categories = data.categories;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    currentPage = 1;
    fetchPortfolios();
  }

  onMount(() => {
    fetchPortfolios();
    // fetchCategories();
  });
</script>

<svelte:head>
  <title>Admin - Portfolio Management</title>
</svelte:head>

<div class="container">
  <div class="flex justify-between items-center mb-4">
    <h1>Portfolio Gallery</h1>
    <div class="flex gap-4">
      <div class="form-group" style="margin-bottom: 0;">
        <input
          type="text"
          placeholder="Search portfolios..."
          class="form-input"
          bind:value={searchQuery}
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <!-- <div class="form-group" style="margin-bottom: 0;"> -->
						<!-- 		<label for="category-select">Choose Category</label> -->
      <!--   <select -->
					 <!--     name="category-select" -->
						<!-- 				id="category-select" -->
      <!--     class="form-input" -->
      <!--     bind:value={selectedCategory} -->
      <!--     onchange={handleCategoryChange} -->
      <!--   > -->
      <!--     <option value="">All Categories</option> -->
      <!--     {#each categories as category} -->
      <!--       <option value={category.category}>{category.category}</option> -->
      <!--     {/each} -->
      <!--   </select> -->
      <!-- </div> -->
      <button class="btn btn-primary" onclick={handleSearch}>Search</button>
						<!-- <button class="button secondary" onclick={resetSearch}>Reset</button> -->
    </div>
  </div>
  
  {#if loading}
    <div class="text-center">
      <p>Loading portfolios...</p>
    </div>
  {:else if portfolios.length > 0}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: var(--size-4); margin-bottom: var(--size-6);">
      {#each portfolios as portfolio}
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{portfolio.title}</h3>
            <div class="flex justify-between items-center">
              <small style="color: var(--text-2);">{portfolio.category}</small>
              <small style="color: var(--text-2);">by {portfolio.userName}</small>
            </div>
          </div>
          <div class="card-content">
            <p style="margin-bottom: var(--size-3);">{portfolio.description}</p>
            <a href={portfolio.url} target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              View Project
            </a>
          </div>
        </div>
      {/each}
    </div>
    
    {#if totalPages > 1}
      <Pagination
        {currentPage}
        {totalPages}
        onPageChange={handlePageChange}
      />
    {/if}
  {:else}
    <div class="text-center">
      <p style="color: var(--text-2);">No portfolios found matching your criteria.</p>
    </div>
  {/if}
</div>
