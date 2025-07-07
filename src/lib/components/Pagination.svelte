<script>
  let { currentPage, totalPages, onPageChange } = $props();
  
  // Reactive computed for visible pages
  let visiblePages = $derived(getVisiblePages());
  
  function getVisiblePages() {
    if (totalPages <= 1) return [];
    
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    // Always show first page
    if (totalPages === 1) {
      return [1];
    }
    
    // If we have very few pages, show all
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }
    
    // Calculate the range around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    // Always include first page
    rangeWithDots.push(1);
    
    // Add dots if there's a gap after first page
    if (start > 2) {
      rangeWithDots.push('...');
    }
    
    // Add the range around current page
    for (let i = start; i <= end; i++) {
      rangeWithDots.push(i);
    }
    
    // Add dots if there's a gap before last page
    if (end < totalPages - 1) {
      rangeWithDots.push('...');
    }
    
    // Always include last page (if it's not already included)
    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  }
  
  function handlePageClick(page) {
    if (page !== '...' && page !== currentPage && typeof page === 'number') {
      onPageChange(page);
    }
  }
  
  function handlePrevious() {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }
  
  function handleNext() {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }
</script>

{#if totalPages > 1}
  <div class="pagination">
    <button 
      class="pagination-btn" 
      onclick={handlePrevious}
      disabled={currentPage === 1}
      title="Previous page"
    >
      ← Previous
    </button>
    
    {#each visiblePages as page}
      {#if page === '...'}
        <span class="pagination-dots">
          ...
        </span>
      {:else}
        <button 
          class="pagination-btn" 
          class:active={page === currentPage}
          onclick={() => handlePageClick(page)}
          title="Go to page {page}"
        >
          {page}
        </button>
      {/if}
    {/each}
    
    <button 
      class="pagination-btn" 
      onclick={handleNext}
      disabled={currentPage === totalPages}
      title="Next page"
    >
      Next →
    </button>
  </div>
  
  <div class="pagination-info">
    Page {currentPage} of {totalPages}
  </div>
{/if}

<style>
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin: 2rem 0 1rem 0;
    flex-wrap: wrap;
  }
  
  .pagination-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    color: #333;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    min-width: 40px;
  }
  
  .pagination-btn:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #999;
  }
  
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .pagination-dots {
    padding: 0.5rem;
    color: #666;
    cursor: default;
    user-select: none;
  }
  
  .pagination-info {
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .pagination {
      gap: 0.25rem;
    }
    
    .pagination-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      min-width: 35px;
    }
  }
</style>
