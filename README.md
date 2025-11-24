# Eternion Timeline Generator - Phase 1

A Node.js API server that generates personalized astrological timeline narratives using Swiss Ephemeris calculations and AI-generated archetypal story paths.

## 🌟 Features

- **Swiss Ephemeris Integration**: Calculate precise planetary positions and natal charts
- **Transit Calculations**: Analyze 364 days of astrological transits
- **Aspect Detection**: Identify conjunctions, squares, trines, and sextiles
- **AI Narratives**: Generate 4 archetypal story paths using OpenAI GPT-4o
- **Beautiful UI**: Modern, responsive frontend with smooth animations

## 📋 Prerequisites

- Node.js 16.x or higher
- npm (Node Package Manager)
- OpenAI API Key

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify environment variables:**
   The `.env` file should already contain:
   ```
   OPENAI_API_KEY=your_key_here
   PORT=3000
   ```

3. **Verify ephemeris files:**
   Make sure the following files exist in the `ephemeris/` directory:
   - `sepl_18.se1`
   - `semo_18.se1`

## 🎮 Usage

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Use test data (optional):**
   - Click "Use Test Data" button to pre-fill the form with example data

4. **Enter your information:**
   - Decision or question
   - Life context
   - Birth date and time
   - Birth location (latitude/longitude)

5. **Generate timeline:**
   - Click "Generate My Timeline"
   - Wait 30-90 seconds for calculations
   - View your 4 archetypal path narratives

## 🏗️ Architecture

### Core Components

**server.js**
- Express API server
- Swiss Ephemeris integration for astronomical calculations
- Transit aspect detection algorithm
- OpenAI GPT-4o integration for narrative generation

**index.html**
- Single-page application
- Responsive form interface
- Results display with narrative cards
- Loading states and error handling

### The Four Archetypes

1. **The Magus Path**: Innovation, mastery, manifestation (Jupiter/Mercury/Uranus)
2. **The Warrior Path**: Challenge, courage, action (Mars/Pluto/Saturn)
3. **The Nurturer Path**: Care, growth, emotion (Moon/Venus/Neptune)
4. **The Trickster Path**: Surprise, adaptability, humor (Mercury/Uranus/Moon)

## 📊 API Endpoints

### POST `/api/generate-timeline`

Generate astrological timeline narratives.

**Request Body:**
```json
{
  "decision": "Should I start my own business?",
  "lifeContext": "I've been working in corporate for 10 years...",
  "birthDate": "1990-06-15",
  "birthTime": "14:30",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "narratives": [
    {
      "path": "The Magus Path",
      "theme": "Innovation, mastery, and manifestation...",
      "story": "You will embark on a journey...",
      "keyTransits": ["Transit Jupiter trine Natal Sun (March 15, 2025)"],
      "timeframe": "March - June 2025"
    }
  ],
  "transitsSummary": {
    "totalAspects": 47,
    "calculationTime": "32 seconds"
  }
}
```

### GET `/api/health`

Check server status.

**Response:**
```json
{
  "status": "ok",
  "ephemerisPath": "/path/to/ephemeris"
}
```

## 🧪 Testing

### Test Data
Use the built-in test data by clicking "Use Test Data" button:
- **Decision**: "Should I start my own business?"
- **Birth Date**: June 15, 1990
- **Birth Time**: 14:30
- **Location**: New York City (40.7128, -74.0060)

### Expected Results
- Calculation time: 30-90 seconds
- 4 narrative paths generated
- 40-60 total transit aspects found
- Each narrative: 300-400 words

## 📁 File Structure

```
project/
├── server.js              # Main server with Swiss Ephemeris & OpenAI
├── index.html             # Frontend interface
├── package.json           # Dependencies
├── .env                   # Environment variables
├── ephemeris/
│   ├── sepl_18.se1       # Planetary ephemeris data
│   └── semo_18.se1       # Moon ephemeris data
└── README.md             # This file
```

## 🔧 Technical Details

### Swiss Ephemeris
- Calculates planetary positions with high precision
- Uses Placidus house system
- Supports all 10 major planets (Sun through Pluto)

### Aspect Detection
- **Conjunction**: 0° ± 8° orb
- **Sextile**: 60° ± 6° orb
- **Square**: 90° ± 8° orb
- **Trine**: 120° ± 8° orb

### AI Generation
- Model: GPT-4o
- Temperature: 0.8 (creative but coherent)
- Max tokens: 600 per narrative
- Prompt engineering for archetypal consistency

## ⚠️ Phase 1 Limitations

This is a test version with:
- ❌ No user authentication
- ❌ No database storage
- ❌ No credit system
- ❌ No rate limiting
- ❌ No production deployment

## 🚧 Phase 2 (Not Yet Implemented)

Phase 2 will add:
- Supabase authentication
- User accounts
- Credit management (3 free per month)
- Birth chart storage
- Generation history
- Production deployment

## 🐛 Troubleshooting

**Server won't start:**
- Check Node.js version: `node --version` (should be 16+)
- Verify all dependencies installed: `npm install`
- Check port 3000 is available

**Ephemeris errors:**
- Verify `ephemeris/` folder contains `.se1` files
- Check file permissions

**API errors:**
- Verify OpenAI API key in `.env`
- Check internet connection
- Review server logs in terminal

**Slow performance:**
- Normal calculation time: 30-90 seconds
- Factors: OpenAI API speed, transit calculations
- Check terminal for progress logs

## 📝 Success Criteria

- [x] User can input birth data and decision
- [x] Server calculates natal chart correctly
- [x] Server finds all transit aspects over 364 days
- [x] System generates 4 distinct archetypal narratives
- [x] Response time under 90 seconds
- [x] Frontend displays results clearly
- [x] No crashes or errors during normal operation

## 📄 License

This is a test/development version. All rights reserved.

## 🆘 Support

For issues or questions about Phase 1, review:
1. Terminal logs for error messages
2. Browser console for frontend errors
3. API response format and validation
4. Swiss Ephemeris documentation

---

**Built with:**
- Node.js + Express
- Swiss Ephemeris (swisseph)
- OpenAI GPT-4o
- Vanilla JavaScript
- CSS3 with gradients and animations

