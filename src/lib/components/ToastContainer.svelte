<script lang="ts">
	import Toast from './Toast.svelte';
	import { toastStore } from '../stores/toast';
	
	function removeToast(id: string) {
		toastStore.remove(id);
	}
</script>

<div class="toast-container">
	{#each $toastStore as toast (toast.id)}
		<Toast
			id={toast.id}
			type={toast.type}
			message={toast.message}
			duration={toast.duration}
			dismissible={toast.dismissible}
			onRemove={removeToast}
		/>
	{/each}
</div>
