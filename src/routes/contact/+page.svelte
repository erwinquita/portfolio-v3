<script lang="ts">
	import { enhance } from '$app/forms';
	import { toastStore } from '$lib/stores/toast';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	
	let isSubmitting = $state(false);

	// Show toast messages based on form result
	$effect(() => {
		if (form?.success) {
			toastStore.success('Thank you for your message! I\'ll get back to you soon.');
		} else if (form?.error) {
			toastStore.error(form.error);
		}
	});
</script>

<svelte:head>
	<title>Contact - Get In Touch</title>
	<meta name="description" content="Get in touch with me for collaborations and opportunities" />
</svelte:head>

<section class="section">
	<div class="container">
		<h1 class="text-center mb-4">Get In Touch</h1>
		<p class="text-center" style="color: var(--gray-6); margin-bottom: var(--size-6);">
			I'm always interested in new opportunities and collaborations. 
			Feel free to reach out if you'd like to work together!
		</p>
		
		<div class="form">
			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
			>
				<div class="form-group">
					<label for="name" class="form-label">Name</label>
					<input
						type="text"
						id="name"
						name="name"
						class="form-input"
						required
						value={form?.data?.name || ''}
					/>
				</div>
				
				<div class="form-group">
					<label for="email" class="form-label">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						class="form-input"
						required
						value={form?.data?.email || ''}
					/>
				</div>
				
				<div class="form-group">
					<label for="subject" class="form-label">Subject</label>
					<input
						type="text"
						id="subject"
						name="subject"
						class="form-input"
						required
						value={form?.data?.subject || ''}
					/>
				</div>
				
				<div class="form-group">
					<label for="message" class="form-label">Message</label>
					<textarea
						id="message"
						name="message"
						class="form-textarea"
						required
						rows="6"
					>{form?.data?.message || ''}</textarea>
				</div>
				
				<div class="text-center">
					<button type="submit" class="button" disabled={isSubmitting}>
						{isSubmitting ? 'Sending...' : 'Send Message'}
					</button>
				</div>
			</form>
		</div>
	</div>
</section>

<section class="section" style="background: var(--portfolio-surface);">
	<div class="container">
		<h2>Other Ways to Connect</h2>
		<div class="grid">
			<div class="card text-center">
				<h3>Email</h3>
				<p>hello@yourportfolio.com</p>
				<a href="mailto:hello@yourportfolio.com" class="button secondary">Send Email</a>
			</div>
			<div class="card text-center">
				<h3>LinkedIn</h3>
				<p>Let's connect professionally</p>
				<a href="#" target="_blank" rel="noopener noreferrer" class="button secondary">View Profile</a>
			</div>
			<div class="card text-center">
				<h3>GitHub</h3>
				<p>Check out my code</p>
				<a href="#" target="_blank" rel="noopener noreferrer" class="button secondary">View Repositories</a>
			</div>
		</div>
	</div>
</section>
