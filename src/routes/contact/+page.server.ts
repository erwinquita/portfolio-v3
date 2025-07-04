import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const subject = data.get('subject') as string;
		const message = data.get('message') as string;

		// Basic validation
		if (!name || !email || !subject || !message) {
			return fail(400, {
				error: 'All fields are required.',
				data: { name, email, subject, message }
			});
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Please enter a valid email address.',
				data: { name, email, subject, message }
			});
		}

		try {
			// Here you would typically send the email or save to database
			// For now, we'll just log it and return success
			console.log('Contact form submission:', {
				name,
				email,
				subject,
				message,
				timestamp: new Date().toISOString()
			});

			// In a real application, you might:
			// - Send an email using a service like SendGrid, Mailgun, etc.
			// - Save the message to a database
			// - Send a notification to your admin panel

			return {
				success: true
			};
		} catch (error) {
			console.error('Error processing contact form:', error);
			return fail(500, {
				error: 'Something went wrong. Please try again later.',
				data: { name, email, subject, message }
			});
		}
	}
};
