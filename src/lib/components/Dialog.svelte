<script>
  let { 
    title = '',
    isOpen = $bindable(false),
    onClose = () => {},
    children
  } = $props();
  
  let dialogElement = $state(null);
  
  $effect(() => {
    if (isOpen && dialogElement) {
      dialogElement.showModal();
    } else if (!isOpen && dialogElement) {
      dialogElement.close();
    }
  });
  
  function handleClose() {
    isOpen = false;
    onClose();
  }
  
  function handleDialogClick(event) {
    // Close dialog when clicking on backdrop
    if (event.target === dialogElement) {
      handleClose();
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<dialog 
  bind:this={dialogElement}
  onclick={handleDialogClick}
  onkeydown={handleKeydown}
  onclose={handleClose}
>
  <div class="dialog-content">
    <div class="dialog-header">
      <h2>{title}</h2>
      <button 
        type="button" 
        class="dialog-close-button"
        onclick={handleClose}
        aria-label="Close dialog"
      >
        ×
      </button>
    </div>
    
    <div class="dialog-body">
      {@render children()}
    </div>
  </div>
</dialog>

<style>
  dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    padding: 0;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .dialog-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .dialog-close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .dialog-close-button:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .dialog-body {
    padding: 1rem;
  }
</style>
