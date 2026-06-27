// Cloudflare Pages Function — POST /voice
// Called by Twilio when a browser client initiates an outbound call.
// Returns TwiML that dials the requested number from your UK caller ID.

export async function onRequestPost(context) {
  const { request, env } = context;

  const body   = await request.text();
  const params = new URLSearchParams(body);
  const to     = (params.get('To') || '').trim();

  let twiml;
  if (to) {
    // Escape any XML special characters in the number (safety measure)
    const safeTo       = to.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const safeCallerId = (env.TWILIO_CALLER_ID || '').replace(/&/g, '&amp;');
    twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${safeCallerId}"><Number>${safeTo}</Number></Dial></Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>No destination number provided.</Say></Response>`;
  }

  return new Response(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
