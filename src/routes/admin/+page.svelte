<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  
  let { data } = $props();
  
  let createDialog = $state(null);
  let editDialog = $state(null);
  let deleteDialog = $state(null);
  
  let editingPortfolio = $state(null);
  let deletingPortfolio = $state(null);
  
  let isEditing = $state(false);
  let originalFormData = $state({});
  let hasChanges = $state(false);
  
  function openCreateDialog() {
    createDialog?.showModal();
  }
  
  function openEditDialog(portfolio) {
    editingPortfolio = portfolio;
    originalFormData = {
      title: portfolio.title,
      description: portfolio.description,
      url: portfolio.url,
      userId: portfolio.userId,
      categoryId: portfolio.categoryId
    };
    isEditing = false;
    hasChanges = false;
    editDialog?.showModal();
  }
  
  function openDeleteDialog(portfolio) {
    deletingPortfolio = portfolio;
    deleteDialog?.showModal();
  }
  
  function closeDialogs() {
    createDialog?.close();
    editDialog?.close();
    deleteDialog?.close();
    editingPortfolio = null;
    deletingPortfolio = null;
    isEditing = false;
    originalFormData = {};
    hasChanges = false;
  }
  
  function checkForChanges(event) {
    const formData = new FormData(event.target.form);
    const currentData = {
      title: formData.get('title'),
      description: formData.get('description'),
      url: formData.get('url'),
      userId: parseInt(formData.get('userId')),
      categoryId: parseInt(formData.get('categoryId'))
    };
    
    hasChanges = Object.keys(originalFormData).some(key => 
      originalFormData[key] !== currentData[key]
    );
  }
  
  function handleEditSubmit(event) {
    if (!hasChanges) {
      event.preventDefault();
      return;
    }
  }
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
              <button class="button secondary" onclick={() => openEditDialog(portfolio)}>Edit</button>
              <button class="button danger" onclick={() => openDeleteDialog(portfolio)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<!-- Create Portfolio Dialog -->
<dialog bind:this={createDialog}>
  <h2>Add New Portfolio</h2>
  <form method="POST" action="?/create" use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        closeDialogs();
        await invalidateAll();
        toast.success('Portfolio created successfully!');
      } else if (result.type === 'failure') {
        toast.error('Failed to create portfolio. Please try again.');
      }
    };
  }}>
    <div class="form-group">
      <label for="create-title">Title</label>
      <input type="text" id="create-title" name="title" required />
    </div>
    
    <div class="form-group">
      <label for="create-description">Description</label>
      <textarea id="create-description" name="description" required></textarea>
    </div>
    
    <div class="form-group">
      <label for="create-url">URL</label>
      <input type="url" id="create-url" name="url" required />
    </div>
   
				<!-- edit update to default logged in user when auth is added -->
    <div class="form-group">
      <label for="create-user">Creator</label>
      <select id="create-user" name="userId" required>
        <option value="">Select a creator</option>
        {#each data.users as user}
          <option value={user.id}>{user.name}</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="create-category">Category</label>
      <select id="create-category" name="categoryId" required>
        <option value="">Select a category</option>
        {#each data.categories as category}
          <option value={category.id}>{category.category}</option>
        {/each}
      </select>
    </div>
    
    <div class="dialog-actions">
      <button type="button" class="button secondary" onclick={closeDialogs}>Cancel</button>
      <button type="submit" class="button">Create Portfolio</button>
    </div>
  </form>
</dialog>

<!-- Edit Portfolio Dialog -->
<dialog bind:this={editDialog}>
  <h2>Edit Portfolio</h2>
  {#if editingPortfolio}
    <form method="POST" action="?/update" onsubmit={handleEditSubmit} use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          closeDialogs();
          await invalidateAll();
          toast.success('Portfolio updated successfully!');
        } else if (result.type === 'failure') {
          toast.error('Failed to update portfolio. Please try again.');
        }
      };
    }}>
      <input type="hidden" name="id" value={editingPortfolio.id} />
      
      <div class="form-group">
        <label for="edit-title">Title</label>
        <input type="text" id="edit-title" name="title" value={editingPortfolio.title} required oninput={checkForChanges} />
      </div>
      
      <div class="form-group">
        <label for="edit-description">Description</label>
        <textarea id="edit-description" name="description" required oninput={checkForChanges}>{editingPortfolio.description}</textarea>
      </div>
      
      <div class="form-group">
        <label for="edit-url">URL</label>
        <input type="url" id="edit-url" name="url" value={editingPortfolio.url} required oninput={checkForChanges} />
      </div>
      
      <div class="form-group">
        <label for="edit-user">Creator</label>
        <select id="edit-user" name="userId" required onchange={checkForChanges}>
          <option value="">Select a creator</option>
          {#each data.users as user}
            <option value={user.id} selected={user.id === editingPortfolio.userId}>{user.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="edit-category">Category</label>
        <select id="edit-category" name="categoryId" required onchange={checkForChanges}>
          <option value="">Select a category</option>
          {#each data.categories as category}
            <option value={category.id} selected={category.id === editingPortfolio.categoryId}>{category.category}</option>
          {/each}
        </select>
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="button secondary" onclick={closeDialogs}>Cancel</button>
        <button type="submit" class="button" disabled={!hasChanges}>Update Portfolio</button>
      </div>
    </form>
  {/if}
</dialog>

<!-- Delete Portfolio Dialog -->
<dialog bind:this={deleteDialog}>
  <h2>Delete Portfolio</h2>
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
</dialog>
