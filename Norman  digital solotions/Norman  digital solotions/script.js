document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('contactForm');
	const status = document.getElementById('formStatus');
	// Reemplaza este correo por el tuyo para recibir solicitudes
	const RECEIVER = 'TU_EMAIL@example.com';

	if (!form) return;

	form.addEventListener('submit', async function (e) {
		e.preventDefault();
		const name = document.getElementById('name').value.trim();
		const email = document.getElementById('email').value.trim();
		const subject = document.getElementById('subject').value.trim() || 'Solicitud de asesoría';
		const message = document.getElementById('message').value.trim();

		if (!name || !email || !message) {
			status.textContent = 'Por favor completa los campos requeridos.';
			status.style.color = 'red';
			return;
		}

		// Intentar enviar a la API local; si falla, caer al mailto
		try {
			const res = await fetch('/api/requests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, subject, message })
			});
			if (res.ok) {
				status.textContent = 'Solicitud enviada. Gracias.';
				status.style.color = 'green';
				form.reset();
				return;
			} else {
				const err = await res.json();
				throw new Error(err.error || 'Error en envío');
			}
		} catch (err) {
			// Fallback: abrir mailto
			const body = `Nombre: ${name}%0D%0ACorreo: ${email}%0D%0A%0D%0A${encodeURIComponent(message)}`;
			const mailto = `mailto:${RECEIVER}?subject=${encodeURIComponent(subject)}&body=${body}`;
			status.textContent = 'No se pudo enviar al servidor. Abriendo cliente de correo...';
			status.style.color = 'orange';
			window.location.href = mailto;
		}
	});
});
