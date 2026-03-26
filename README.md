# UrbanThreads — Gameball Integration Demo

A mock e-commerce app demonstrating a full Gameball loyalty integration for the UrbanThreads fictional clothing store.

## Features

- **Session Switching** — fake login page to switch between customer sessions for demo purposes
- **Customer Registration** — registers customers in Gameball via `POST /customers`
- **Profile Completion** — sends a `profile_completed` event with metadata
- **Checkout (Earn + Redeem)** — city-based shipping, live cashback preview, optional points redemption (hold → place order), and earnedpoints shown on success
- **Write a Review** — sends a `write_review` event; attaching an image sets `has_image: true` to enable separate reward campaigns
- **Loyalty Profile Page** — auto-loads points balance, VIP tier with progress toward next tier, and all reward campaign statuses split into achieved vs. not yet achieved

## Getting Started

### Prerequisites

- Node.js 18+
- A Gameball account with an API Key and Secret Key (find them in **Settings → Admin Settings → Account Integration**)

### Installation

```bash
git clone https://github.com/aya127/urbanthreads-gameball.git
cd urbanthreads-gameball
npm install
```

### Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Gameball keys:

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
│   └── SessionContext.jsx   # Shared session state (customerId, keys, holdReference)
├── components/
│   ├── ConfigBar.jsx        # API key connection status
│   └── StatusBanner.jsx     # Success / error / loading banners
├── pages/
│   ├── Login.jsx            # Session switcher (demo only)
│   ├── Register.jsx         # Step 1: customer registration
│   ├── CompleteProfile.jsx  # Step 2: profile_completed event
│   ├── Checkout.jsx         # Step 3: shipping, cashback preview, hold + order
│   ├── WriteReview.jsx      # Step 4: write_review event with optional image
│   └── ProfilePage.jsx      # Step 5: points, tier progress, badges
└── App.jsx                  # Layout + navigation
```

## API Reference

See [INTEGRATION_NOTES.md](./INTEGRATION_NOTES.md) for a full breakdown of every endpoint used, assumptions made, known API issues, and production recommendations.

## Built With

- React 18 + Vite
- Gameball REST API v4.0
- Zero external UI libraries
