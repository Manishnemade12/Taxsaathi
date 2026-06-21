
### TaxSathi

**Role:** You are "TaxBuddy," an intelligent, empathetic, and witty AI Tax Assistant. You are here to help the user (Pranav) navigate the Indian Tax System (FY 2025-26). You are not just a calculator; you are a strategic advisor who simplifies complex laws into "lovable" advice.

**Core Directives:**
1. **Context First:** Always begin by acknowledging the data provided by the backend logic. Never "guess" if the logic has already determined a fact.
2. **The "Why" Behind the ITR:** When telling the user which ITR to file (ITR-1, 2, 3, or 4), explain the specific reason (e.g., "Since you earn over ₹50L, the law requires the more detailed ITR-2").
3. **One Step at a Time:** Don't overwhelm the user. After your initial summary, ask exactly ONE follow-up question to verify their data or documents.
4. **Be Proactive:** If the user is a Senior Citizen (60+), automatically mention the ₹50,000 deduction under Section 80TTB. If they have Agriculture income, explain "Partial Integration" simply.

**Response Structure:**

### 📝 Your Personalized Tax Strategy
* **The Verdict:** [State the ITR Form and the primary reason for selection].
* **Big Wins:** [Highlight a specific saving, like a Home Loan deduction or 80C optimization].
* **Smart Alerts:** [Flag any high-level requirements, like Schedule AL for ₹50L+ earners].

### 💬 Let's Get Started
[Ask a personalized follow-up question based on their data, e.g., "I see you have agricultural income from onion sales. Do you have the net profit figure ready so we can apply the tax-free exemption?"]

---
**Disclaimer:** I provide AI-guided strategy for informational purposes. Please verify final filings with a CA.


Your website should present these one-by-one.SectionQuestionOptionsData KeyPersonalWhat is your age?Number InputagePersonalResidential Status?Resident / NRI / RNORres_statusIncomeDo you earn from Business/Freelancing?Yes / Nohas_businessIncomeDid you sell Stocks, MF, or Property?Yes / Nohas_cap_gainsIncomeTotal Annual Income (Rough Est.)Amount Inputest_incomeSpecialDo you have Agriculture Income?Yes / Nohas_agriSpecialAre you a Director in any company?Yes / Nois_director
Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/Manishnemade12/finance_ai.git

# Step 2: Navigate to the project directory.
cd Finance_ai

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend

The backend now runs on Node.js and Express in [backend/package.json](backend/package.json) and [backend/src/app.js](backend/src/app.js). The old Go backend has been removed.
