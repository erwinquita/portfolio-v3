<script>
 import { toast } from 'svelte-easy-toast';
  
  let { user, categories, portfolio = null, onSubmit, onCancel } = $props();
  
  let formData = $state({
    title: portfolio?.title || '',
    description: portfolio?.description || '',
    url: portfolio?.url || '',
    userId: portfolio?.userId || '',
    categoryId: portfolio?.categoryId || ''
  });
  
  let originalData = $state({
    title: portfolio?.title || '',
    description: portfolio?.description || '',
    url: portfolio?.url || '',
    userId: portfolio?.userId || '',
    categoryId: portfolio?.categoryId || ''
  });
  
  let loading = $state(false);
  let errors = $state({});
  
  function validateForm() {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    if (!formData.userId) {
      newErrors.userId = 'User is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }
  
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  function hasChanges() {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }
  
  async function handleSubmit() {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    if (portfolio && !hasChanges()) {
      toast.info('No changes detected');
      return;
    }
    
    loading = true;
    try {
      await onSubmit(formData);
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    if (portfolio && hasChanges()) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    onCancel();
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div class="form-group">
    <label for="title" class="form-label">Title *</label>
    <input
      type="text"
      id="title"
      class="form-input"
      class:error={errors.title}
      bind:value={formData.title}
      placeholder="Enter portfolio title"
      required
    />
    {#if errors.title}
      <div style="color: var(--red-5); font-size: var(--font-size-0); margin-top: var(--size-1);">
        {errors.title}
      </div>
    {/if}
  </div>
  
  <div class="form-group">
    <label for="description" class="form-label">Description *</label>
    <textarea
      id="description"
      class="form-input form-textarea"
      class:error={errors.description}
      bind:value={formData.description}
      placeholder="Enter portfolio description"
      required
    ></textarea>
    {#if errors.description}
      <div style="color: var(--red-5); font-size: var(--font-size-0); margin-top: var(--size-1);">
        {errors.description}
      </div>
    {/if}
  </div>
  
  <div class="form-group">
    <label for="url" class="form-label">URL *</label>
    <input
      type="url"
      id="url"
      class="form-input"
      class:error={errors.url}
      bind:value={formData.url}
      placeholder="https://example.com"
      required
    />
    {#if errors.url}
      <div style="color: var(--red-5); font-size: var(--font-size-0); margin-top: var(--size-1);">
        {errors.url}
      </div>
    {/if}
  </div>
  
  <div class="form-group">
    <label for="userId" class="form-label">User *</label>
    <select
      id="userId"
      class="form-input"
      class:error={errors.userId}
      bind:value={formData.userId}
      required
    >
      <option value="">Select a user</option>
      {#each user as user}
        <option value={user.id}>{user.name} ({user.email})</option>
      {/each}
    </select>
    {#if errors.userId}
      <div style="color: var(--red-5); font-size: var(--font-size-0); margin-top: var(--size-1);">
        {errors.userId}
      </div>
    {/if}
  </div>
  
  <div class="form-group">
    <label for="categoryId" class="form-label">Category *</label>
    <select
      id="categoryId"
      class="form-input"
      class:error={errors.categoryId}
      bind:value={formData.categoryId}
      required
    >
      <option value="">Select a category</option>
      {#each categories as category}
        <option value={category.id}>{category.category}</option>
      {/each}
    </select>
    {#if errors.categoryId}
      <div style="color: var(--red-5); font-size: var(--font-size-0); margin-top: var(--size-1);">
        {errors.categoryId}
      </div>
    {/if}
  </div>
  
  <div class="dialog-footer">
    <button type="button" class="btn" onclick={handleCancel} disabled={loading}>
      Cancel
    </button>
    <button type="submit" class="btn btn-primary" disabled={loading} class:loading>
      {loading ? 'Saving...' : portfolio ? 'Update' : 'Create'}
    </button>
  </div>
</form>

<style>
  .form-input.error {
    border-color: var(--red-5);
  }
  
  .form-input.error:focus {
    border-color: var(--red-5);
    box-shadow: 0 0 0 var(--border-size-2) var(--red-5);
  }
</style>
