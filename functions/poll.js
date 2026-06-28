// Cloudflare Pages Function — GET /poll?callSid=xxx
// Polls Twilio REST API for the current status of a call.
// Browser calls this every 2 seconds until a terminal status is returned.

const TERMINAL = new Set(['completed', 'busy', 'no-answer', 'failed', 'canceled']);

export async function onRequestGet(context) {
  const { request, env } = context;
  const callSid = new URL(request.url).searchParams.get('callSid');

  if (!callSid) {
    return json({ error: 'Missing callSid' }, 400);
  }

  const auth = btoa(`${env.TWILIO_API_KEY}:${env.TWILIO_API_SECRET}`);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`,
    { headers: { 'Authorization': `Basic ${auth}` } }
  );

  const data = await res.json();

  return json({
    status:   data.status,
    duration: data.duration,
    terminal: TERMINAL.has(data.status),
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
