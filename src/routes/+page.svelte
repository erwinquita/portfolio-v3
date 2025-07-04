<script>
  import { onMount } from 'svelte';
  
  let featuredPortfolios = $state([]);
  let loading = $state(true);
  
  onMount(async () => {
    try {
      const response = await fetch('/api/portfolio?limit=3');
      if (response.ok) {
        const data = await response.json();
        featuredPortfolios = data.portfolios;
      }
    } catch (error) {
      console.error('Error fetching featured portfolios:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div class="container">
  <div class="text-center mb-4">
    <h1 style="font-size: var(--font-size-8); margin-bottom: var(--size-4);">Welcome to Portfolio App</h1>
    <p style="font-size: var(--font-size-3); color: var(--text-2); margin-bottom: var(--size-6);">
      Discover amazing portfolios and showcase your work
    </p>
    <div class="flex gap-4 justify-center">
      <a href="/portfolio" class="btn btn-primary">View All Portfolios</a>
      <a href="/admin" class="btn">Manage Portfolios</a>
    </div>
  </div>
  
  {#if loading}
    <div class="text-center">
      <p>Loading featured portfolios...</p>
    </div>
  {:else if featuredPortfolios.length > 0}
    <section style="margin-top: var(--size-8);">
      <h2 style="text-align: center; margin-bottom: var(--size-6);">Featured Portfolios</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--size-4);">
        {#each featuredPortfolios as portfolio}
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">{portfolio.title}</h3>
              <small style="color: var(--text-2);">{portfolio.category}</small>
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
    </section>
  {:else}
    <div class="text-center">
      <p style="color: var(--text-2);">No portfolios available yet. <a href="/admin">Add some!</a></p>
    </div>
  {/if}
</div>
