# Sales Activity Tracker

A beautiful, easy-to-use web app for tracking daily sales activity (calls, emails, contacts, responses) with automatic goal tracking and Excel export.

## 🎯 How Data Saving Works

**IMPORTANT - Read This First!**

This app currently saves data **in your browser's local storage**. This means:

✅ **What works:**
- Enter data and close the browser → comes back when you reopen
- Multiple weeks of history stored
- Export all data to Excel anytime

⚠️ **Current limitation:**
- Data is stored on **ONE COMPUTER/BROWSER** only
- If Rep 1 uses their laptop, Rep 2 can't see Rep 1's data from their computer
- Different browsers (Chrome vs Firefox) = different data

**For a team with multiple people:**
- Option A: Have everyone use ONE shared computer to enter data
- Option B: Each person uses their own computer, then exports their data weekly to combine
- Option C: Add database (I can help upgrade this - takes ~30 mins extra)

---

## 📋 STEP-BY-STEP DEPLOYMENT GUIDE

### Prerequisites (One-Time Setup)

You need these installed on your computer:

1. **Node.js** (the engine that runs the app)
   - Go to: https://nodejs.org
   - Download the "LTS" version (big green button)
   - Install it (click through all the defaults)
   - **Test it worked:** Open Terminal (Mac) or Command Prompt (Windows)
   - Type: `node --version`
   - Should show something like `v20.11.0`

2. **Cursor** (the code editor - optional but recommended)
   - Go to: https://cursor.sh
   - Download and install
   - Opens just like VS Code

---

### STEP 1: Get This Project on Your Computer

**Option A: If you have the ZIP file:**
1. Extract/unzip the folder
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Navigate to the folder:
   ```bash
   cd path/to/sales-tracker-deploy
   ```
   Example: `cd /Users/yourname/Downloads/sales-tracker-deploy`

**Option B: If you have this folder already:**
1. Open Terminal/Command Prompt
2. Navigate to the folder:
   ```bash
   cd path/to/sales-tracker-deploy
   ```

---

### STEP 2: Install Dependencies

In the Terminal/Command Prompt (while in the project folder):

```bash
npm install
```

This downloads all the code libraries the app needs. Takes 1-2 minutes.

You'll see a bunch of text scroll by - this is normal!

---

### STEP 3: Test It Locally

Run this command:

```bash
npm start
```

- Your browser should automatically open to `http://localhost:3000`
- You should see the Sales Tracker app!
- Try entering some data and clicking "Save This Week's Data"
- **Leave Terminal open** - closing it stops the app

**To stop the app:** Press `Ctrl+C` in Terminal

---

### STEP 4: Deploy to Vercel (Make It Live!)

**4a. Sign up for Vercel (Free):**
1. Go to: https://vercel.com
2. Click "Sign Up"
3. Use your GitHub, GitLab, or email

**4b. Install Vercel CLI:**

In Terminal (you can close the npm start from before):

```bash
npm install -g vercel
```

**4c. Deploy the app:**

Still in your project folder in Terminal:

```bash
vercel
```

**Follow the prompts:**
- "Set up and deploy?" → **Y** (yes)
- "Which scope?" → Choose your account
- "Link to existing project?" → **N** (no)
- "What's your project's name?" → **sales-tracker** (or whatever you want)
- "In which directory is your code located?" → **./** (just press Enter)
- "Want to override settings?" → **N** (no)

**Wait 30-60 seconds...**

When it's done, you'll see:
```
✅ Deployed to production. Run `vercel --prod` to overwrite later.
🔗 https://sales-tracker-abc123.vercel.app
```

**That's your live URL!** Share it with your team!

---

### STEP 5: Make Future Updates

After you deploy, if you make changes and want to update the live site:

```bash
vercel --prod
```

Done! Your changes are live in 30 seconds.

---

## 🎓 How to Use the App

1. **First Time Setup:**
   - Click "Settings"
   - Adjust daily/weekly goals if needed
   - Add your team's sales rep names
   - Click "Save Goals"

2. **Daily Use:**
   - Select your name from dropdown
   - Select the week (defaults to current week)
   - Enter your numbers for each day
   - Click "Save This Week's Data"

3. **Tracking Progress:**
   - Top cards show weekly totals vs goals
   - Progress bars turn green when goals are met 🎉
   - Each day shows individual progress

4. **Exporting Data:**
   - Click "Export to Excel" button
   - Downloads an Excel file with ALL saved data
   - Includes 3 sheets: Activity Data, Goals, Summary by Rep

---

## 📝 Making Changes to the Code

**Using Cursor (Recommended):**

1. Open Cursor
2. File → Open Folder → Select `sales-tracker-deploy`
3. Open `src/App.js` (the main code)
4. Make your changes
5. Save (Cmd+S or Ctrl+S)
6. In Terminal: `vercel --prod`

**Common Changes You Might Want:**

**Change colors:**
- Line 62-63: Main gradient background
- Line 195-196: Button colors

**Change goals:**
- Line 10-16: Default goal values

**Add a new field (like "Demos"):**
- This is more complex - ask Claude for help!

---

## 🆘 Troubleshooting

**"npm: command not found"**
- Node.js isn't installed correctly
- Reinstall from nodejs.org

**"Port 3000 is already in use"**
- Something else is using that port
- Try: `npx kill-port 3000` then `npm start` again

**"Cannot find module"**
- Run `npm install` again
- Delete `node_modules` folder and run `npm install`

**App works locally but not on Vercel:**
- Make sure you ran `vercel --prod` not just `vercel`
- Check the Vercel dashboard for error logs

**Data not saving:**
- Check browser console for errors (F12 → Console tab)
- Make sure you clicked "Save This Week's Data"
- Try a different browser

**Excel export is empty:**
- You need to save data first!
- Make sure you clicked "Save This Week's Data" at least once

---

## 🚀 Next Steps / Upgrades

Want to add:
- Database so multiple people can share data?
- Email notifications when goals are hit?
- Charts and graphs?
- Manager dashboard?
- Mobile app version?

Just ask Claude - share what you want and Claude can help modify the code!

---

## 📱 Sharing With Your Team

Once deployed, give everyone this link:
```
https://your-app-name.vercel.app
```

**Important reminders for your team:**
- Each person needs to select THEIR name from dropdown
- Click "Save This Week's Data" after entering numbers
- Data only exists in their browser (unless you upgrade to database)
- Can export to Excel anytime to backup data

---

## 💾 How Storage Works (Technical Details)

The app uses the browser's `window.storage` API to persist data. Each piece of data is stored with a unique key:

- Goals: `tracker-goals`
- Rep list: `tracker-reps`
- Week data: `week-YYYY-MM-DD-RepName`

When you export to Excel, the app:
1. Lists all keys starting with `week-`
2. Loads each week's data
3. Combines everything into Excel sheets
4. Downloads the file

This is why all data exports, even from weeks ago!

---

## 📞 Need Help?

Just ask Claude! Copy/paste any error messages or describe what you're trying to do.
