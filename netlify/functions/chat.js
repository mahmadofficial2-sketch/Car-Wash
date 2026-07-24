// netlify/functions/chat.js
// Secure server-side proxy to OpenRouter. The API key lives only in Netlify's
// environment variables (set in Site settings → Environment variables),
// never in browser-visible code.

const SYSTEM_PROMPT = `You are the official ProWash website assistant. ProWash is a premium DOORSTEP car wash and detailing service operating ONLY in Faisalabad, Pakistan.

Business facts you must use for every relevant answer:
- Service model: we come to the customer's home/office anywhere in Faisalabad. We do NOT have a physical branch/shop customers visit.
- Working hours: every day, 8:00 AM – 9:00 PM.
- WhatsApp / phone: 0320-9835916 (this is the primary way to book).
- Packages:
  1. Basic Wash — Rs 850: full exterior pressure wash, foam shampoo rinse, tire & rim shine, quick towel dry.
  2. Premium Wash — Rs 1500: everything in Basic + full interior vacuum, dashboard & panel polish, glass & mirror cleaning. (Most booked package)
  3. Full Detailing — Rs 2500: everything in Premium + deep seat & mat cleaning, engine bay wash, odor treatment.
- Coverage areas mentioned on site: D-Ground, Peoples Colony, Madina Town, Susan Road, Jaranwala Road, Gulberg, Canal Road, Samundari Road — but we serve all of Faisalabad, customers should just message their area to confirm.
- Booking process: 1) Message on WhatsApp with address + package, 2) Team arrives with pressure-wash equipment and washes the car at the doorstep, 3) Customer inspects and pays on the spot.
- Payment: cash on completion (pay after the wash, at the doorstep).
- Facebook page: linked in the footer of the site.

Tone: Friendly, concise, helpful — like a helpful local business assistant. Reply in the same language/style the user writes in (if they write in Roman Urdu, reply in Roman Urdu; if English, reply in English). Keep answers short (2-4 sentences) unless the user asks for detail. If asked something you don't have info about (e.g. exact arrival time for a booking, real-time availability), tell them to confirm on WhatsApp at 0320-9835916 rather than guessing. Never invent prices, areas, or policies not listed above.`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server not configured: missing OPENROUTER_API_KEY' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  // Basic guardrails: cap history length and message size sent to the model
  const trimmed = messages.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 1500),
  }));

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.URL || 'https://prowash.netlify.app',
        'X-Title': 'ProWash Website Assistant',
      },
      body: JSON.stringify({
        // Free-tier friendly model on OpenRouter. Swap to any model slug you prefer.
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed],
        max_tokens: 400,
        temperature: 0.4,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || 'OpenRouter request failed' }),
      };
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a reply right now.";
    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error contacting OpenRouter' }) };
  }
};
