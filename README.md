# ProWash — Premium Doorstep Car Wash Website (Faisalabad)

Static site. No build step needed.

## File structure
```
prowash2/
├── index.html
├── netlify.toml
├── css/
│   └── style.css
├── js/
│   └── main.js
└── assets/
    └── images/
        ├── banner.jpg
        ├── favicon.png
        ├── images__2_.jpg
        ├── images__3_.jpg
        ├── auto-cleaning-before-after.jpg
        └── icon-*.svg
```

## Setting up the AI Chatbot (OpenRouter + Netlify Functions)

The site includes a chat widget (bottom-right, above the WhatsApp button) that answers questions about pricing, coverage, and booking using an AI model via OpenRouter — **without exposing your API key in the browser**.

### 1. Get your OpenRouter API key
You already have one. Keep it private — never paste it into `index.html`, `main.js`, or any file that gets uploaded to GitHub.

### 2. Add the key as a Netlify environment variable
1. Go to your site on [app.netlify.com](https://app.netlify.com)
2. **Site configuration → Environment variables → Add a variable**
3. Key: `OPENROUTER_API_KEY`
4. Value: *paste your OpenRouter key*
5. Save, then **trigger a redeploy** (Deploys tab → Trigger deploy → Deploy site) so the function picks up the variable

### 3. That's it
The function at `netlify/functions/chat.js` handles all requests server-side. The browser only ever talks to `/.netlify/functions/chat` on your own domain — your OpenRouter key stays on Netlify's servers.

### Notes
- Default model is `meta-llama/llama-3.1-8b-instruct:free` (free tier on OpenRouter). You can change the `model` value inside `netlify/functions/chat.js` to any other OpenRouter model slug.
- The chatbot's knowledge (packages, prices, hours, WhatsApp number) is hardcoded in the `SYSTEM_PROMPT` at the top of `chat.js` — update it there if your prices or details change.
- This only works after deploying to Netlify (functions don't run when opening `index.html` directly on your computer).

## Deploy on GitHub + Netlify

1. Create a new GitHub repo (e.g. `prowash-website`) and push this whole folder
   ```
   git init
   git add .
   git commit -m "ProWash premium website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/prowash-website.git
   git push -u origin main
   ```
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
3. Connect your GitHub account, select the `prowash-website` repo
4. Build settings: leave **Build command empty**, **Publish directory = `.`** (already set in `netlify.toml`)
5. Click **Deploy site** — done. Netlify gives you a live URL immediately (you can rename it under Site settings → Domain management, e.g. `prowash-faisalabad.netlify.app`)

## Things already wired up
- WhatsApp number: `0320-9835916` (used in nav, hero, packages, floating button)
- Booking form → Formspree endpoint `https://formspree.io/f/mqerlodj`
- All images lazy-load with a smooth fade-in
- Fully responsive (mobile menu included)

## To customize later
- Swap/add gallery photos in `assets/images/` and reference them in `index.html`
- Update coverage-area chips in the `#area` section
- Replace the `#` Facebook link in the footer with your real Facebook Page URL
