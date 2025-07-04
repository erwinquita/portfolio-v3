<script>
  let { currentPage, totalPages, onPageChange } = $props();
  
  function getVisiblePages() {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  }
  
  function handlePageClick(page) {
    if (page !== '...' && page !== currentPage) {
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
      class="btn pagination-btn" 
      onclick={handlePrevious}
      disabled={currentPage === 1}
    >
      Previous
    </button>
    
    {#each getVisiblePages() as page}
      {#if page === '...'}
        <span class="pagination-btn" style="background: none; border: none; cursor: default;">
          ...
        </span>
      {:else}
        <button 
          class="btn pagination-btn" 
          class:active={page === currentPage}
          onclick={() => handlePageClick(page)}
        >
          {page}
        </button>
      {/if}
    {/each}
    
    <button 
      class="btn pagination-btn" 
      onclick={handleNext}
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
{/if}
