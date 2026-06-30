// Cloudflare Pages Function — POST /call
// Initiates an outbound call via Twilio REST API.
// No SDK or JWT needed — just a signed REST request.

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (body.password !== env.DIALER_PASSWORD) {
    return json({
      error: 'Unauthorized',
      debug_sent_len: body.password?.length,
      debug_env_len: env.DIALER_PASSWORD?.length,
      debug_env_defined: env.DIALER_PASSWORD !== undefined,
    }, 401);
  }

  const to = (body.to || '').replace(/\s+/g, '');
  if (!to.startsWith('+')) {
    return json({ error: 'Number must be in +44 format' }, 400);
  }

  // Build absolute URLs for TwiML and status callback
  const base = new URL(request.url);
  const twimlUrl  = `${base.origin}/twiml`;

  const auth = btoa(`${env.TWILIO_API_KEY}:${env.TWILIO_API_SECRET}`);

  const params = new URLSearchParams({
    To:      to,
    From:    env.TWILIO_CALLER_ID,
    Url:     twimlUrl,
    Timeout: '25',   // rings for 25 seconds before giving up
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return json({ error: data.message || 'Twilio error', code: data.code }, res.status);
  }

  return json({ callSid: data.sid, status: data.status });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
