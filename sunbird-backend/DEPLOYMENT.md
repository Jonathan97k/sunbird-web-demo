# Sunbird Tourism PLC - Render Deployment Guide

Follow these exact step-by-step instructions exactly as written to deploy your new API to the cloud completely for free!

---

### Step 1: Push Code to GitHub
Render needs to pull your code from a repository. Open your terminal inside your local folder and run:
\`\`\`bash
# 1. Initialize the root repository if you haven't already
git init

# 2. Stage all backend files natively (this safely ignores node_modules and .env)
git add .

# 3. Create an initial commit
git commit -m "Initial backend release"

# 4. Push effectively to your remote GitHub master/main branch natively
git push origin main
\`\`\`

---

### Step 2: Set up Render
1. Go to **[Render.com](https://render.com/)** and sign up for a free account.
2. Once signed in, look for the **"New +"** button at the top right and select **"Web Service"**.
3. Render will prompt you to connect to a Git provider. Choose **GitHub** and authorize access to your repositories.
4. Select your **Sunbird Tourism repository** from the list.
5. On the creation screen, use these strict settings:
   - **Name**: `sunbird-api` (or whatever you like)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ($0/month) 

*(Notice: Render will automatically detect the \`render.yaml\` file we created and fill most of this out for you automatically!)*

---

### Step 3: Add Environment Variables on Render
Your local `.env` file does not exist on GitHub, which means Render doesn't know your database URL yet. Because of this, the server will crash until you explicitly add them!

Still on the Render generation page (or under the explicitly labelled **Environment** tab later):
1. **`DATABASE_URL`**: Paste your exact Neon URL here (the identical one inside your local `.env`).
2. **`JWT_SECRET`**: You need a complex random string. To generate a perfectly secure one from your terminal, run this completely safe command:
   \`\`\`bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   \`\`\`
   Copy the output and paste it here!
3. **`NODE_ENV`**: Explicitly type `production` (This accurately optimizes the Node.js performance environment).

Click **Create Web Service**! You'll see a terminal window explicitly building your code.

---

### Step 4: Run Database Migration on Production
Wait! You already successfully ran migrations on your Neon database locally! Since your local API and Render API are physically connected to the **exact same Neon database**, your tables and seed data *already exist simultaneously in production*.

**However, if you ever change to a new empty database**, here is how you rebuild tables securely directly from Render:
1. Go to your Render Web Service dashboard and tap the **Shell** tab on the left sidebar.
2. This drops you into a remote terminal physically running your backend. Type:
   \`\`\`bash
   npm run migrate
   \`\`\`
3. Followed explicitly immediately by your seeder:
   \`\`\`bash
   npm run seed
   \`\`\`

---

### Step 5: Test the Live API
1. On your Render dashboard, find the URL located directly under your service name (e.g., `https://sunbird-backend-xxxx.onrender.com`).
2. Click it! You will immediately see the JSON Health-Check banner returning:
   \`\`\`json
   { "status": "ok", "message": "Sunbird Tourism API", "version": "1.0.0", ... }
   \`\`\`
3. Grab that URL and throw it strictly into your `test-requests.http` file locally to test your `/api/auth/login` natively through the cloud logic infrastructure!

---

### Step 6: Link Your Frontend to the Real Infrastructure
Right now, your website Javascript is probably trying to call `/api/hotels` or `http://localhost:3000`. You need to globally replace it. 
Inside your `main.js` (or wherever your `fetch()` logic inherently lives):

**Change This:**
\`\`\`javascript
const API_URL = 'http://localhost:3000/api';
\`\`\`

**To This:**
\`\`\`javascript
const API_URL = 'https://your-shiny-new-render-url.onrender.com/api';
\`\`\`

---

### ⚠️ IMPORTANT: Render Free Tier Limitations ⚠️
Because Render is explicitly offering this web-hosting slot entirely for free, they enact strict physical limits:
1. **The 15-Minute Sleep**: If no one visits your website natively or calls an API explicitly for 15 solid minutes, Render will structurally shut down your server exactly like putting a laptop securely to sleep.
2. **The 30-Second Wakeup (Cold Start)**: The very next time someone goes directly to your website, Render has to violently wake your server back up. *This explicitly means the very first request effectively inherently takes roughly 30 to 45 seconds to load.* It might look like your website dynamically crashed, but it's just spinning up!

**How to Mitigate This for The Demo:**
If you are doing a live client pitch, a sleeping server natively looks bad. 
To securely bypass this exclusively, go physically to **[UptimeRobot](https://uptimerobot.com)**, sign up explicitly entirely for free, and set a monitor to rigorously logically ping your explicit `https://your-render-url.onrender.com/` Health Endpoint natively every **14 minutes**. Your server will literally never sleep!
