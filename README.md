# UrbanThreads — Gameball Integration Demo

A mock e-commerce app demonstrating a full Gameball loyalty integration for the UrbanThreads fictional clothing store.

## Live Demo

> Deploy to Vercel or Netlify in one click, or run locally below.

## Features

- **Customer Registration** — registers users in Gameball via `POST /customers`
- **Profile Completion** — sends a `profile_completed` event with metadata
- **Write a Review** — sends a `write_review` event; distinguishes photo vs. text-only reviews via `has_image` metadata
- **Checkout (Earn + Redeem)** — fetches points balance → holds points → places order with cashback + redemption in a single Order API call
- **Loyalty Profile Page** — displays points balance, VIP tier with progress, and all badge/campaign statuses

## Getting Started

### Prerequisites

- Node.js 18+
- A Gameball account with an API Key and Secret Key (find them in Settings → Admin Settings → Account Integration)

### Installation

```bash
git clone https://github.com/aya127/urbanthreads-gameball.git
cd urbanthreads-gameball
npm install
```

### Configuration

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then open `.env` and fill in your Gameball keys (find them in **Settings → Admin Settings → Account Integration**):

```env
VITE_GAMEBALL_API_KEY=your_api_key_here
VITE_GAMEBALL_SECRET_KEY=your_secret_key_here
```

> The `.env` file is git-ignored and will never be committed.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── lib/
│   ├── gameball.js          # All Gameball API calls
│   └── SessionContext.jsx   # Shared session state (customerId, keys, holdRef)
├── components/
│   ├── ConfigBar.jsx        # Connection status indicator
│   ├── StatusBanner.jsx     # Success / error / loading banners
│   └── ApiHint.jsx          # Shows which API was called
├── pages/
│   ├── Register.jsx         # Step 1: customer registration
│   ├── CompleteProfile.jsx  # Step 2: profile event
│   ├── WriteReview.jsx      # Step 3: review event
│   ├── Checkout.jsx         # Step 4: hold + order flow
│   └── ProfilePage.jsx      # Step 5: points, tier, badges
└── App.jsx                  # Layout + routing
```

## API Reference

See [INTEGRATION_NOTES.md](./INTEGRATION_NOTES.md) for a full breakdown of every API endpoint used and production recommendations.

## Built With

- React 18 + Vite
- Gameball REST API v4.0
- Zero external UI libraries
