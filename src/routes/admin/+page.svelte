<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import Dialog from '$lib/components/Dialog.svelte';
  import PortfolioForm from '$lib/components/PortfolioForm.svelte';
  
  let { data } = $props();
  
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
    currentPortfolio = portfolio;
    portfolioMode = 'edit';
    portfolioDialog = true;
  }
  
  function openViewDialog(portfolio) {
    currentPortfolio = portfolio;
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
  
  {#if data.portfolios.length === 0}
    <p>No portfolios found. Create your first portfolio to get started!</p>
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
        {#each data.portfolios as portfolio}
          <tr>
            <td>{portfolio.title}</td>
            <td>{portfolio.category?.category || 'Uncategorized'}</td>
            <td>{portfolio.user?.name || 'Unknown'}</td>
            <td><a href={portfolio.url} target="_blank" rel="noopener noreferrer">View</a></td>
            <td class="table-actions">
              <button class="button secondary" onclick={() => openViewDialog(portfolio)}>View Details</button>
              <button class="button secondary" onclick={() => openEditDialog(portfolio)}>Edit</button>
              <button class="button danger" onclick={() => openDeleteDialog(portfolio)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
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

