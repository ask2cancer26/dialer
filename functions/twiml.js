// Cloudflare Pages Function — GET|POST /twiml
// Twilio fetches this when the call is answered.
// A 3-second pause then hang up — realistic enough without saying anything suspicious.

export async function onRequest() {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="3"/><Hangup/></Response>',
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  );
}
