<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	interface ToastProps {
		id: string;
		type: 'success' | 'error' | 'warning' | 'info';
		message: string;
		duration?: number;
		dismissible?: boolean;
		onRemove: (id: string) => void;
	}
	
	let {
		id,
		type = 'info',
		message,
		duration = 5000,
		dismissible = true,
		onRemove
	}: ToastProps = $props();
	
	let element: HTMLDivElement;
	let timeoutId: number | undefined;
	// let progressElement: HTMLDivElement;
	let removing = $state(false);
	
	const icons = {
		success: '✓',
		error: '✕',
		warning: '⚠',
		info: 'ℹ'
	};
	
	function dismiss() {
		if (removing) return;
		
		removing = true;
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		
		// Wait for animation to complete before removing
		setTimeout(() => {
			onRemove(id);
		}, 300);
	}
	
	onMount(() => {
		if (duration > 0) {
			timeoutId = setTimeout(dismiss, duration);
		}
	});
	
	onDestroy(() => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	});
</script>

<div
	bind:this={element}
	class="toast-item"
	class:removing
	role="alert"
	aria-live="polite"
>
	<div class="toast-content {type}">
		<span class="toast-icon">{icons[type]}</span>
		<span class="toast-message">{message}</span>
		{#if dismissible}
			<button class="toast-close" onclick={dismiss} aria-label="Close notification">
				×
			</button>
		{/if}
		{#if duration > 0}
			<div
				class="toast-progress"
			></div>
		{/if}
	</div>
</div>
