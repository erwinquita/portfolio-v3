import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
	duration?: number;
	dismissible?: boolean;
}

export interface ToastOptions {
	duration?: number;
	dismissible?: boolean;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);
	
	// Keep track of recent toasts to prevent duplicates
	const recentToasts = new Set<string>();

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function createToastKey(type: string, message: string): string {
		return `${type}:${message}`;
	}

	function add(toast: Omit<Toast, 'id'>) {
		const toastKey = createToastKey(toast.type, toast.message);
		
		// Check if this exact toast was recently added
		if (recentToasts.has(toastKey)) {
			return null; // Don't add duplicate toast
		}

		const id = generateId();
		const newToast: Toast = {
			id,
			duration: 5000,
			dismissible: true,
			...toast
		};

		// Add to recent toasts set
		recentToasts.add(toastKey);
		
		// Remove from recent toasts after a short delay to allow for legitimate duplicates later
		setTimeout(() => {
			recentToasts.delete(toastKey);
		}, 1000);

		update((toasts) => [...toasts, newToast]);
		return id;
	}

	function remove(id: string) {
		update((toasts) => toasts.filter((toast) => toast.id !== id));
	}

	function clear() {
		update(() => []);
		recentToasts.clear();
	}

	// Convenience methods for different toast types
	function success(message: string, options?: ToastOptions) {
		return add({ type: 'success', message, ...options });
	}

	function error(message: string, options?: ToastOptions) {
		return add({ type: 'error', message, ...options });
	}

	function warning(message: string, options?: ToastOptions) {
		return add({ type: 'warning', message, ...options });
	}

	function info(message: string, options?: ToastOptions) {
		return add({ type: 'info', message, ...options });
	}

	return {
		subscribe,
		add,
		remove,
		clear,
		success,
		error,
		warning,
		info
	};
}

export const toastStore = createToastStore();
