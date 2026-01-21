# Oalethia StarManifest™

A full-stack astrological action timeline generator that creates personalized, actionable plans aligned to your birth chart. Built with Next.js, Express, Swiss Ephemeris, and OpenAI GPT-4o.

## 🌟 Features

- **Swiss Ephemeris Integration**: Calculate precise planetary positions and natal charts
- **Transit Calculations**: Analyze astrological transits over customizable timeframes
- **Aspect Detection**: Identify conjunctions, sextiles, squares, and trines
- **AI-Powered Action Plans**: Generate 8-12 specific, actionable steps aligned to transits
- **User Authentication**: Supabase-based authentication system
- **Credit System**: Free monthly credits with subscription options
- **Points & Gamification**: Earn points for completing actions and daily affirmations
- **Birth Chart Storage**: Save and manage your birth chart data
- **Timeline History**: Access and review your past timeline generations
- **Daily Affirmations**: Personalized daily affirmations for your journey
- **Modern UI**: Beautiful, responsive Next.js frontend with smooth animations

## 📋 Prerequisites

- Node.js 20.x or higher
- npm (Node Package Manager)
- OpenAI API Key
- Supabase account (for authentication and database)
- Stripe account (for payments - optional for development)

## 🚀 Quick Start

### 1. Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for both backend and frontend.

### 2. Set Up Environment Variables

**Backend (Root `.env`):**
Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Frontend (`frontend-react/.env.local`):**
Copy `frontend-react/.env.example` to `frontend-react/.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

### 3. Verify Ephemeris Files

Make sure the following files exist in the `ephemeris/` directory:
- `sepl_18.se1` (Planetary ephemeris data)
- `semo_18.se1` (Moon ephemeris data)

### 4. Start Development

**Start both frontend and backend simultaneously:**
```bash
npm run dev:all
```

**Or start them separately:**
```bash
# Backend only (port 3000)
npm run dev:backend

# Frontend only (port 3001)
npm run dev:frontend
```

### 5. Access the Application

- **Frontend**: http://localhost:3001 (Next.js default port)
- **Backend API**: http://localhost:3000

## 🏗️ Architecture

### Backend (`server_phase2.js`)

- **Express API Server**: RESTful API endpoints
- **Swiss Ephemeris**: Astronomical calculations for natal charts and transits
- **OpenAI Integration**: GPT-4o for generating action plans and affirmations
- **Supabase**: Authentication, database, and user management
- **Stripe**: Payment processing and subscription management
- **Rate Limiting**: Protection against abuse

### Frontend (`frontend-react/`)

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern, responsive styling
- **Supabase Client**: Authentication and real-time data
- **Stripe Elements**: Secure payment processing

## 📊 Key API Endpoints

### Authentication Required

- `POST /api/generate-timeline` - Generate personalized action timeline
- `GET /api/credits` - Get user's credit balance
- `POST /api/credits/use` - Use credits for generation
- `GET /api/birth-chart` - Get saved birth chart
- `POST /api/birth-chart` - Save/update birth chart
- `GET /api/history` - Get timeline generation history
- `GET /api/points` - Get user points
- `POST /api/affirm` - Record daily affirmation
- `POST /api/action-progress` - Update action completion status

### Public/Anonymous

- `POST /api/generate-timeline-anonymous` - Generate timeline without account (limited credits)
- `POST /api/check-anonymous-credits` - Check anonymous user credits
- `GET /api/geocode` - Location search for birth place

### Stripe

- `POST /api/create-checkout-session` - Create subscription checkout
- `POST /api/create-credits-checkout` - Purchase credits
- `POST /api/create-portal-session` - Manage subscription

## 🔧 Technical Details

### Swiss Ephemeris
- Calculates planetary positions with high precision
- Uses Placidus house system
- Supports all 10 major planets (Sun through Pluto)
- Calculates Ascendant and Midheaven

### Aspect Detection
- **Conjunction**: 0° ± 8° orb
- **Sextile**: 60° ± 6° orb
- **Square**: 90° ± 8° orb
- **Trine**: 120° ± 8° orb

### AI Generation
- **Model**: GPT-4o with web search capabilities
- **Temperature**: 0.7 (balanced creativity)
- **Action Plans**: 8-12 specific, actionable steps per timeline
- **Strategies**: Detailed 2-3 paragraph strategies for each action
- **Affirmations**: Daily affirmations aligned to goals

### Credit System
- **Free Tier**: 3 credits per month (resets monthly)
- **Anonymous Users**: Limited free credits per IP
- **Subscriptions**: Premium tiers with more credits
- **Credit Purchase**: Buy additional credits as needed

### Points System
- **Action Completed**: 10 points
- **Timeline Finished**: 50 points
- **Daily Login**: 5 points
- **Daily Affirmation**: 5 points
- **Streaks**: Bonus points for consecutive days
- **Milestones**: Bonus points for action milestones

## 📁 Project Structure

```
oalethia-starmanifest/
├── server_phase2.js          # Main backend server
├── package.json               # Backend dependencies
├── .env                       # Backend environment variables
├── .env.example               # Backend env template
├── ephemeris/                 # Swiss Ephemeris data files
│   ├── sepl_18.se1
│   └── semo_18.se1
├── frontend-react/            # Next.js frontend
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   ├── contexts/              # React contexts (Auth)
│   ├── lib/                   # Utility libraries
│   ├── package.json           # Frontend dependencies
│   ├── .env.local             # Frontend environment variables
│   └── .env.example            # Frontend env template
└── README.md                  # This file
```

## 🚀 Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard:
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT` (optional, defaults to 3000)
3. Build command: `npm install`
4. Start command: `node server_phase2.js`

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Base directory**: `frontend-react`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend-react/.next`
3. Set environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SENTRY_DSN` (optional)

## 🧪 Development Scripts

```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Start both frontend and backend
npm run dev:all

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start production backend
npm start
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check Node.js version: `node --version` (should be 20+)
- Verify all dependencies: `npm install`
- Check `.env` file exists and has all required variables
- Ensure port 3000 is available

**Frontend won't start:**
- Navigate to `frontend-react/` directory
- Run `npm install`
- Check `frontend-react/.env.local` exists
- Verify `NEXT_PUBLIC_API_URL` points to correct backend

**Ephemeris errors:**
- Verify `ephemeris/` folder contains `.se1` files
- Check file permissions
- Ensure files are not corrupted

**API errors:**
- Verify OpenAI API key in `.env`
- Check Supabase credentials
- Review server logs in terminal
- Check browser console for frontend errors

**Authentication issues:**
- Verify Supabase URL and keys match
- Check Supabase project settings
- Ensure RLS policies are configured correctly

## 🔐 Environment Variables Guide

### Backend (`.env`)
- **Test keys** for local development (`sk_test_...`, `whsec_...`)
- **Live keys** for production (set in Render dashboard)

### Frontend (`.env.local`)
- **Test keys** for local development (`pk_test_...`)
- **Live keys** for production (set in Netlify dashboard)
- `NEXT_PUBLIC_API_URL` should be `http://localhost:3000` for dev, your Render URL for production

## 📝 Phase 2 Features

✅ **Implemented:**
- Supabase authentication
- User accounts and profiles
- Credit management (3 free per month)
- Birth chart storage
- Timeline generation history
- Action progress tracking
- Points and gamification system
- Daily affirmations
- Subscription management (Stripe)
- Rate limiting
- Production deployment ready

## 🆘 Support

For issues or questions:
1. Check terminal logs for backend errors
2. Check browser console for frontend errors
3. Review API response format and validation
4. Verify environment variables are set correctly
5. Check Supabase and Stripe dashboard configurations

---

**Built with:**
- Node.js + Express
- Next.js 15 + React 19
- Swiss Ephemeris (sweph)
- OpenAI GPT-4o
- Supabase
- Stripe
- TypeScript
- Tailwind CSS

**© 2025 Oalethia. All rights reserved.**
