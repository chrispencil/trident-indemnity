const CONFIG = {
  // URL of the Cloudflare Worker that receives the PDF and emails it (with the
  // PDF attached) from info@pexcel.co.za. The recipient is set server-side in the
  // Worker, not here. Paste the deployed *.workers.dev URL after deploying.
  WORKER_URL: 'https://trident-indemnity-mailer.christian-901.workers.dev',
  // Only used for the manual mailto fallback if the Worker is unreachable.
  ADMIN_EMAIL: 'christiancpcy@gmail.com',
  FORM_VERSION: '2026-07-12'
};
