<script>
  let {
    portfolio = null,
    users = [],
    categories = [],
    mode = 'create', // 'create', 'edit', or 'view'
    onSubmit = () => {},
    onCancel = () => {},
    onEdit = () => {}, // New prop for switching to edit mode from view
    hasChanges = $bindable(false),
    submitDisabled = $bindable(false),
    resetDisabled = $bindable(false)
  } = $props();
  
  // Form data state
  let formData = $state({
    title: '',
    description: '',
    url: '',
    userId: '',
    categoryId: ''
  });
  
  let originalFormData = $state({});
  let lastPortfolioId = $state(null);
  let lastMode = $state(null);
  
  // Initialize form data when portfolio or mode changes
  $effect(() => {
    const currentPortfolioId = portfolio?.id || null;
    
    // Only reinitialize if portfolio ID or mode actually changed
    if (currentPortfolioId !== lastPortfolioId || mode !== lastMode) {
      if ((mode === 'edit' || mode === 'view') && portfolio) {
        originalFormData = {
          title: portfolio.title || '',
          description: portfolio.description || '',
          url: portfolio.url || '',
          userId: portfolio.userId || '',
          categoryId: portfolio.categoryId || ''
        };
        formData = { ...originalFormData };
      } else if (mode === 'create') {
        formData = {
          title: '',
          description: '',
          url: '',
          userId: '',
          categoryId: ''
        };
        originalFormData = {};
      }
      
      lastPortfolioId = currentPortfolioId;
      lastMode = mode;
      
      // Update form state after initialization
      updateFormState();
    }
  });
  
  // Update hasChanges and submitDisabled when form data changes
  function updateFormState() {
    if (mode === 'edit' && Object.keys(originalFormData).length > 0) {
      const changes = Object.keys(originalFormData).some(key => 
        originalFormData[key] !== formData[key]
      );
      hasChanges = changes;
      submitDisabled = !changes;
      resetDisabled = !changes;
    } else if (mode === 'create') {
      // For create mode, check if required fields are filled (URL is not required)
      const requiredFields = ['title', 'description', 'userId', 'categoryId'];
      const allRequiredFieldsFilled = requiredFields.every(field => 
        formData[field] && formData[field].toString().trim() !== ''
      );
      
      // Check if any field has content for reset button
      const hasAnyContent = Object.values(formData).some(value => 
        value && value.toString().trim() !== ''
      );
      
      hasChanges = allRequiredFieldsFilled;
      submitDisabled = !allRequiredFieldsFilled;
      resetDisabled = !hasAnyContent; // Enable reset if any field has content
    }
  }
  
  function handleSubmit(event) {
    event.preventDefault();
    
    if (mode === 'edit' && !hasChanges) {
      return;
    }
    
    const form = event.target;
    const formDataObj = new FormData(form);
    
    onSubmit(formDataObj, formData);
  }
  
  function handleInputChange() {
    updateFormState();
  }
  
  function resetForm() {
    if ((mode === 'edit' || mode === 'view') && portfolio) {
      formData = { ...originalFormData };
    } else {
      formData = {
        title: '',
        description: '',
        url: '',
        userId: '',
        categoryId: ''
      };
    }
    updateFormState();
  }
  
  // Computed properties
  let submitButtonText = $derived(mode === 'create' ? 'Create Portfolio' : 'Update Portfolio');
  let formTitle = $derived(
    mode === 'create' ? 'Add New Portfolio' : 
    mode === 'edit' ? 'Edit Portfolio' : 
    'Portfolio Details'
  );
  
  // Helper functions for view mode
  function getUserName(userId) {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  }
  
  function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.category : 'Uncategorized';
  }
</script>

<div class="portfolio-form">
  {#if mode === 'view'}
    <!-- View Mode -->
    <div class="portfolio-details">
      <div class="detail-row">
        <strong>Title:</strong>
        <span>{portfolio.title}</span>
      </div>
      
      <div class="detail-row">
        <strong>Category:</strong>
        <span>{getCategoryName(portfolio.categoryId)}</span>
      </div>
      
      <div class="detail-row">
        <strong>Creator:</strong>
        <span>{getUserName(portfolio.userId)}</span>
      </div>
      
      <div class="detail-row">
        <strong>URL:</strong>
        {#if portfolio.url}
          <a href={portfolio.url} target="_blank" rel="noopener noreferrer">{portfolio.url}</a>
        {:else}
          <span>No URL provided</span>
        {/if}
      </div>
      
      <div class="detail-row">
        <strong>Description:</strong>
        <p class="description">{portfolio.description}</p>
      </div>
      
      {#if portfolio.createdAt}
        <div class="detail-row">
          <strong>Created:</strong>
          <span>{new Date(portfolio.createdAt).toLocaleDateString()}</span>
        </div>
      {/if}
      
      {#if portfolio.updatedAt}
        <div class="detail-row">
          <strong>Last Updated:</strong>
          <span>{new Date(portfolio.updatedAt).toLocaleDateString()}</span>
        </div>
      {/if}
    </div>
    
    <div class="form-actions">
      <button type="button" class="button secondary" onclick={onCancel}>
        Close
      </button>
      <button type="button" class="button" onclick={() => onEdit(portfolio)}>
        Edit
      </button>
    </div>
  {:else}
    <!-- Create/Edit Mode -->
    <form onsubmit={handleSubmit}>
      {#if mode === 'edit' && portfolio}
        <input type="hidden" name="id" value={portfolio.id} />
      {/if}
      
      <div class="form-group">
        <label for="portfolio-title">Title *</label>
        <input 
          type="text" 
          id="portfolio-title" 
          name="title" 
          bind:value={formData.title}
          oninput={handleInputChange}
          required 
          placeholder="Enter portfolio title"
        />
      </div>
      
      <div class="form-group">
        <label for="portfolio-description">Description *</label>
        <textarea 
          id="portfolio-description" 
          name="description" 
          bind:value={formData.description}
          oninput={handleInputChange}
          required 
          placeholder="Enter portfolio description"
          rows="4"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="portfolio-url">URL</label>
        <input 
          type="url" 
          id="portfolio-url" 
          name="url" 
          bind:value={formData.url}
          oninput={handleInputChange}
          placeholder="https://example.com (optional)"
        />
      </div>
      
      <div class="form-group">
        <label for="portfolio-user">Creator *</label>
        <select 
          id="portfolio-user" 
          name="userId" 
          bind:value={formData.userId}
          onchange={handleInputChange}
          required
        >
          <option value="">Select a creator</option>
          {#each users as user}
            <option value={user.id}>{user.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="portfolio-category">Category *</label>
        <select 
          id="portfolio-category" 
          name="categoryId" 
          bind:value={formData.categoryId}
          onchange={handleInputChange}
          required
        >
          <option value="">Select a category</option>
          {#each categories as category}
            <option value={category.id}>{category.category}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-actions">
        <button type="button" class="button secondary" onclick={onCancel}>
          Cancel
        </button>
        <button type="button" class="button secondary" disabled={resetDisabled} onclick={resetForm}>
          Reset
        </button>
        <button type="submit" class="button" disabled={submitDisabled}>
          {submitButtonText}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .portfolio-form {
    width: 100%;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: #9ca3af;
  }
  
  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .button:not(:disabled):hover {
    transform: translateY(-1px);
  }
</style>

