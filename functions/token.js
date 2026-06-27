// Cloudflare Pages Function — POST /token
// Generates a Twilio Access Token using Web Crypto (no npm dependencies)

async function buildJwt(accountSid, apiKey, apiSecret, twimlAppSid) {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'HS256', typ: 'JWT', cty: 'twilio-fpa;v=1' };
  const payload = {
    jti:    `${apiKey}-${now}`,
    iss:    apiKey,
    sub:    accountSid,
    nbf:    now,
    exp:    now + 3600,
    grants: {
      identity: 'rehan',
      voice: {
        incoming: { allow: false },
        outgoing: { application_sid: twimlAppSid },
      },
    },
  };

  const b64url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const header64  = b64url(header);
  const payload64 = b64url(payload);
  const input     = `${header64}.${payload64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  const sigBytes = new Uint8Array(sigBuf);
  let binary = '';
  for (let i = 0; i < sigBytes.length; i++) binary += String.fromCharCode(sigBytes[i]);
  const sig64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${input}.${sig64}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.password !== env.DIALER_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Wrong password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await buildJwt(
    env.TWILIO_ACCOUNT_SID,
    env.TWILIO_API_KEY,
    env.TWILIO_API_SECRET,
    env.TWILIO_TWIML_APP_SID,
  );

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
