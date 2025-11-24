const express = require('express');
const sweph = require('sweph');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Set ephemeris path
const ephemerisPath = path.join(__dirname, 'ephemeris');
sweph.set_ephe_path(ephemerisPath);

// Planet constants (sweph uses numerical IDs)
const PLANETS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9
};

const PLANET_NAMES = Object.keys(PLANETS);

// Aspect orbs
const ASPECTS = {
  conjunction: { angle: 0, orb: 8 },
  sextile: { angle: 60, orb: 6 },
  square: { angle: 90, orb: 8 },
  trine: { angle: 120, orb: 8 }
};

/**
 * Calculate Julian Day from date and time
 */
function dateToJulianDay(year, month, day, hour, minute) {
  const decimalTime = hour + minute / 60.0;
  return sweph.julday(year, month, day, decimalTime, 1);  // 1 = Gregorian calendar
}

/**
 * Calculate natal chart with planets and houses
 */
function calculateNatalChart(birthDate, birthTime, latitude, longitude) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  
  const julianDay = dateToJulianDay(year, month, day, hour, minute);
  
  const planets = {};
  
  // Calculate positions for all 10 planets
  for (const [planetName, planetId] of Object.entries(PLANETS)) {
    const result = sweph.calc_ut(julianDay, planetId, 2);  // 2 = SEFLG_SWIEPH (Swiss Ephemeris)
    
    if (result.error) {
      throw new Error(`Error calculating ${planetName}: ${result.error}`);
    }
    
    planets[planetName] = {
      longitude: result.data[0],  // longitude
      latitude: result.data[1],   // latitude
      speed: result.data[3]       // speed
    };
  }
  
  // Calculate houses using Placidus system
  const houses = sweph.houses(julianDay, latitude, longitude, 'P');
  
  return {
    planets,
    houses: houses.data.house,
    ascendant: houses.data.ascendant,
    mc: houses.data.mc,
    julianDay
  };
}

/**
 * Calculate angle between two longitudes (0-180 degrees)
 */
function calculateAngle(long1, long2) {
  let diff = Math.abs(long1 - long2);
  
  // Handle wrap-around
  if (diff > 180) {
    diff = 360 - diff;
  }
  
  return diff;
}

/**
 * Check if angle matches any aspect within orb
 */
function checkAspect(transitLongitude, natalLongitude) {
  const angle = calculateAngle(transitLongitude, natalLongitude);
  
  for (const [aspectName, aspectData] of Object.entries(ASPECTS)) {
    const targetAngle = aspectData.angle;
    const orb = aspectData.orb;
    
    let diff = Math.abs(angle - targetAngle);
    
    // Check for conjunction (0 degrees) special case
    if (targetAngle === 0) {
      if (angle <= orb) {
        return { type: aspectName, orb: angle };
      }
    } else {
      if (diff <= orb) {
        return { type: aspectName, orb: diff };
      }
    }
  }
  
  return null;
}

/**
 * Calculate all transit aspects over specified number of days
 */
function calculateTransitAspects(natalChart, startDate, days = 364) {
  const allAspects = [];
  const [year, month, day] = startDate.split('-').map(Number);
  
  // Starting Julian Day
  const startJD = dateToJulianDay(year, month, day, 0, 0);
  
  // Loop through each day
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentJD = startJD + dayOffset;
    
    // Calculate date for this Julian Day
    const dateInfo = sweph.revjul(currentJD, 1);  // 1 = Gregorian calendar
    const dateStr = `${dateInfo.year}-${String(dateInfo.month).padStart(2, '0')}-${String(dateInfo.day).padStart(2, '0')}`;
    
    // Calculate transit positions for all planets
    for (const [transitPlanetName, transitPlanetId] of Object.entries(PLANETS)) {
      const transitResult = sweph.calc_ut(currentJD, transitPlanetId, 2);  // 2 = SEFLG_SWIEPH
      
      if (transitResult.error) continue;
      
      const transitLongitude = transitResult.data[0];  // longitude from data array
      
      // Check aspects to natal planets
      for (const [natalPlanetName, natalData] of Object.entries(natalChart.planets)) {
        const aspect = checkAspect(transitLongitude, natalData.longitude);
        
        if (aspect) {
          allAspects.push({
            date: dateStr,
            transitPlanet: transitPlanetName,
            natalPlanet: natalPlanetName,
            aspectType: aspect.type,
            orb: aspect.orb.toFixed(2),
            description: `Transit ${transitPlanetName} ${aspect.type} Natal ${natalPlanetName}`
          });
        }
      }
      
      // Check aspects to Ascendant
      const ascAspect = checkAspect(transitLongitude, natalChart.ascendant);
      if (ascAspect) {
        allAspects.push({
          date: dateStr,
          transitPlanet: transitPlanetName,
          natalPlanet: 'ASCENDANT',
          aspectType: ascAspect.type,
          orb: ascAspect.orb.toFixed(2),
          description: `Transit ${transitPlanetName} ${ascAspect.type} Natal ASCENDANT`
        });
      }
    }
  }
  
  return allAspects;
}

/**
 * Format date to readable format
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Select most significant transits spread across the timeline
 */
function selectSignificantTransits(allTransits, count) {
  if (allTransits.length === 0) return [];
  
  // Sort by date
  const sorted = [...allTransits].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Divide timeline into segments
  const segmentSize = Math.floor(sorted.length / count);
  const selected = [];
  
  for (let i = 0; i < count && i * segmentSize < sorted.length; i++) {
    const segment = sorted.slice(i * segmentSize, (i + 1) * segmentSize);
    if (segment.length > 0) {
      // Pick transit with tightest orb from this segment
      const best = segment.reduce((prev, curr) => 
        parseFloat(curr.orb) < parseFloat(prev.orb) ? curr : prev
      );
      selected.push(best);
    }
  }
  
  return selected;
}


/**
 * Generate action timeline using OpenAI GPT-4o
 */
async function generateActionTimeline(outcome, context, availableResources, preferredApproach, timeframeMonths, keyTransits) {
  const transitsList = keyTransits.map(t => 
    `${formatDate(t.date)}: ${t.description}`
  ).join('\n');
  
  const timeframeText = timeframeMonths === 1 ? '1 month' : `${timeframeMonths} months`;
  
  const prompt = `You are an expert astrologer and life coach creating an ACTION-BASED timeline. Write strategies in natural, flowing text without including any URLs, links, or web addresses.

USER'S GOAL: "${outcome}"
USER'S CURRENT SITUATION: "${context}"
AVAILABLE RESOURCES: "${availableResources}"
PREFERRED APPROACH: ${preferredApproach}
TIMEFRAME: ${timeframeText}

KEY TRANSITS IN THIS PERIOD:
${transitsList}

TASK: Create a specific action plan of 8-12 actionable steps aligned to these transits. Each action MUST include a detailed 2-3 paragraph strategy. Use web search to find current information, best practices, and resources to make the actions more specific and actionable.

CRITICAL RULES:
1. Each action MUST be tied to a specific transit date
2. Actions should be CONCRETE and DOABLE (not vague like "be confident")
3. Use the transit energy to suggest WHEN to do each action
4. Mix different types of actions:
   - Communication/outreach actions
   - Skill-building/learning actions  
   - Strategic planning actions
   - Relationship/networking actions
   - Execution/implementation actions
5. Make actions SPECIFIC to their goal (use details from their CURRENT SITUATION)
6. Actions should build on each other toward the outcome
7. NEVER invent details not provided (no names, specific industries, etc.)
8. Keep actions realistic - what they can actually control and do
9. Use their AVAILABLE RESOURCES to ensure actions are feasible (time, budget, network, skills)
10. Match their PREFERRED APPROACH:
    - Conservative: Steady, low-risk, methodical steps
    - Balanced: Mix of steady progress and calculated risks
    - Aggressive: Bold, high-impact, fast-paced actions
11. For each action, provide a detailed 2-3 paragraph strategy that explains HOW to complete it
12. Strategies should be comprehensive, actionable, and leverage the transit energy
13. Use web search to find current best practices, tools, and resources for each action
14. Make actions specific with current information, trends, and available tools
15. For each action, provide 1 daily affirmation that supports completing that specific action
16. Affirmations should be empowering, action-oriented, and 1-2 sentences long
17. Affirmations should focus on personal strength and confidence, avoiding astrological terms

WEB SEARCH GUIDANCE:
- Use web search to find current best practices and tools for each action
- Look up recent trends, technologies, and methods relevant to the user's goal
- Find specific tools, apps, or services that can help complete actions
- Search for current industry information, market trends, or opportunities
- Look up recent success stories or case studies in the user's field
- Find current pricing, requirements, or standards for relevant actions
- Search for networking opportunities, events, or communities
- Use current information to make actions more specific and actionable
- IMPORTANT: Do NOT include URLs, links, or web addresses in your strategy text
- Write strategies in natural, flowing text without any web links or citations
- Reference tools and resources by name only, not by including their URLs

TRANSIT GUIDANCE:
- Jupiter transits = expand, take risks, learn, grow
- Saturn transits = structure, commit, discipline, plan
- Mars transits = act, initiate, push forward, compete
- Venus transits = connect, attract, beautify, harmonize
- Mercury transits = communicate, write, strategize, learn
- Uranus transits = innovate, pivot, try something new
- Neptune transits = envision, create, trust intuition
- Pluto transits = transform deeply, let go, rebuild
- Moon transits = check in emotionally, nurture, reflect
- Sun transits = shine, lead, take center stage

OUTPUT FORMAT (valid JSON array):
[
  {
    "date": "January 15, 2026",
    "action": "Specific action they should take",
    "transit": "Transit description explaining the cosmic timing",
    "strategy": "Detailed 2-3 paragraph strategy explaining how to complete this action. This should be comprehensive and actionable, leveraging the transit energy for maximum effectiveness. The strategy should break down the action into clear steps and provide specific guidance on implementation.",
    "affirmation": "I am confident and capable of completing this action successfully"
  }
]

EXAMPLE (for "hit $10k/month" goal):
[
  {
    "date": "November 5, 2025",
    "action": "Reach out to 5 past clients to let them know you're taking on new projects",
    "transit": "Transit Mercury conjunct Natal Venus - perfect for reconnecting",
    "strategy": "This action leverages Mercury's communication energy to reconnect with past clients. Start by creating a personalized message template that highlights your recent successes and current offerings. Research each client's current business needs and challenges before reaching out to make your message relevant and valuable. Set a specific time block to send all 5 messages within 2 hours to maintain momentum and capitalize on Mercury's communication boost.",
    "affirmation": "I communicate with confidence and attract positive responses from my network"
  }
]

CRITICAL REQUIREMENTS: 
- Every action object MUST include the "strategy" field with a detailed 2-3 paragraph explanation
- Every action object MUST include the "affirmation" field with exactly 1 daily affirmation
- All strings must be on single lines with no line breaks
- Output ONLY valid JSON array with no additional text or markdown

Generate ${Math.min(12, Math.max(8, Math.floor(timeframeMonths * 2)))} actions as valid JSON array:`;

  const response = await openai.responses.create({
    model: 'gpt-4o',
    input: [
      {
        role: 'system',
        content: 'You are an expert astrologer and strategic life coach. You create specific, actionable timelines that align real-world actions with astrological transits. You understand planetary energies and how to leverage them for goal achievement. You MUST include a detailed 2-3 paragraph strategy and 1 affirmation for each action. You output ONLY valid JSON arrays with no additional text or markdown. All strings must be properly escaped and contain no line breaks.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    tools: [
      { type: "web_search" }
    ]
  });
  
  // Handle response with potential web search results
  try {
    // Responses API uses output_text instead of choices[0].message.content
    let content = response.output_text;
    
    // Debug: Log the raw response
    console.log('Raw AI Response:', content);
    
    // Check if web search was used (content will include search results automatically)
    if (content && content.includes('[') && content.includes(']')) {
      console.log('Web search results may be included in response');
    }
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Fix common JSON issues - remove line breaks within strings
    content = content.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');
    content = content.replace(/"([^"]*)\r\n([^"]*)"/g, '"$1 $2"');
    
    // Fix line breaks in the middle of strings (more aggressive)
    content = content.replace(/"([^"]*)\n\s*([^"]*)"/g, '"$1 $2"');
    content = content.replace(/"([^"]*)\r\n\s*([^"]*)"/g, '"$1 $2"');
    
    // Handle incomplete strings at the end
    const lines = content.split('\n');
    let cleanContent = '';
    let inString = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let cleanLine = line;
      
      // Count braces to track object completion
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // If we're in a string and the line doesn't end with a quote, join with next line
      if (inString && !line.includes('"')) {
        cleanContent += ' ' + line.trim();
        continue;
      }
      
      // Check if we're entering or exiting a string
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        inString = !inString;
      }
      
      cleanContent += line + '\n';
      
      // If we have a complete object and the next line looks incomplete, stop here
      if (braceCount === 0 && i < lines.length - 1) {
        const nextLine = lines[i + 1];
        if (nextLine.trim().startsWith('"') && !nextLine.trim().endsWith('"')) {
          break;
        }
      }
    }
    
    content = cleanContent.trim();
    
    // Final cleanup - ensure it ends properly
    if (!content.endsWith('}') && !content.endsWith(']')) {
      const lastBraceIndex = content.lastIndexOf('}');
      if (lastBraceIndex > 0) {
        content = content.substring(0, lastBraceIndex + 1);
      }
    }
    
    // Parse JSON with fallback
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.log('JSON Parse Error:', parseError.message);
      console.log('Attempting to fix JSON...');
      
      // Try to fix common JSON issues
      content = content.replace(/,\s*}/g, '}'); // Remove trailing commas
      content = content.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
      content = content.replace(/"\s*\n\s*"/g, '""'); // Fix empty strings with line breaks
      
      // Try parsing again
      try {
        parsed = JSON.parse(content);
      } catch (secondError) {
        console.log('Second parse attempt failed:', secondError.message);
        // Return a minimal valid response
        parsed = [{
          "date": "Today",
          "action": "Please try generating your timeline again - there was a formatting issue",
          "transit": "The cosmic energies are realigning - please retry",
          "strategy": "There was a technical issue generating your timeline. Please try again by refreshing the page and submitting your request once more. The cosmic energies are realigning and your personalized action plan will be created successfully on your next attempt.",
          "youtubeVideos": [
            {
              "title": "How to Set Goals Effectively",
              "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
              "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
            },
            {
              "title": "Building Better Habits",
              "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
              "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
            },
            {
              "title": "Time Management Tips",
              "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
              "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
            }
          ],
          "articles": [
            {
              "title": "Goal Setting Best Practices",
              "url": "https://example.com/goal-setting"
            },
            {
              "title": "Building Successful Habits",
              "url": "https://example.com/habits"
            },
            {
              "title": "Time Management Strategies",
              "url": "https://example.com/time-management"
            }
          ],
          "affirmation": "I trust the process and know my timeline will be generated successfully"
        }];
      }
    }
    
    // Debug: Log the parsed response
    console.log('Parsed Actions:', JSON.stringify(parsed, null, 2));
    
    // Validate the structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    // Validate each action has required fields
    for (const action of parsed) {
      if (!action.date || !action.action || !action.transit || !action.affirmation) {
        throw new Error('Action missing required fields');
      }
      // Check for either new strategy field or old strategies array (backward compatibility)
      if (!action.strategy && !action.strategies) {
        throw new Error('Action missing strategy or strategies field');
      }
      // YouTube videos and articles are optional for now
      if (action.youtubeVideos && !Array.isArray(action.youtubeVideos)) {
        throw new Error('YouTube videos must be an array');
      }
      if (action.articles && !Array.isArray(action.articles)) {
        throw new Error('Articles must be an array');
      }
    }
    
    console.log(`Generated ${parsed.length} actions successfully`);
    return parsed;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    console.error('Response:', response.output_text);
    throw new Error('Failed to generate valid action timeline');
  }
}

/**
 * Generate timeline affirmations (1 per day for entire timeline)
 */
async function generateTimelineAffirmations(totalDays, outcome, context, transits) {
  const prompt = `Generate ${totalDays} daily affirmations for a ${Math.ceil(totalDays/30)}-month timeline to achieve: "${outcome}"

Context: ${context}

Each affirmation should:
1. Be 1-2 sentences long
2. Be empowering and action-oriented
3. Focus on personal strength, confidence, and manifestation
4. Support the overall goal of: ${outcome}
5. Be unique and not repetitive
6. Avoid mentioning planets, astrology, or cosmic terms
7. Use universal language about energy, success, and achievement

OUTPUT FORMAT: Return ONLY a JSON array of strings, no other text:
[
  "I am confident and capable of achieving my goal of ${outcome}",
  "Every day I take powerful steps toward manifesting ${outcome}",
  "I attract success and opportunities that align with my vision of ${outcome}"
]

Generate exactly ${totalDays} affirmations as a valid JSON array:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert manifestation coach and personal development specialist. You create powerful daily affirmations that focus on personal empowerment, confidence, and goal achievement. You avoid astrological or cosmic language and use universal, empowering language instead. You output ONLY valid JSON arrays with no additional text or markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  try {
    let content = response.choices[0].message.content;
    
    // Clean up the response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Fix common JSON issues
    content = content.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');
    content = content.replace(/"([^"]*)\r\n([^"]*)"/g, '"$1 $2"');
    
    const parsed = JSON.parse(content);
    
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      throw new Error('Expected array of affirmations');
    }
  } catch (error) {
    console.error('Failed to parse affirmations JSON:', error);
    // Return fallback affirmations
    const fallbackAffirmations = [];
    for (let i = 0; i < totalDays; i++) {
      fallbackAffirmations.push(`I am confident and capable of achieving my goal of ${outcome} on day ${i + 1}`);
    }
    return fallbackAffirmations;
  }
}

/**
 * Main API endpoint
 */
app.post('/api/generate-timeline', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { outcome, context, availableResources, preferredApproach, timeframe, birthDate, birthTime, latitude, longitude } = req.body;
    
    // Validate input - birthTime is now optional
    if (!outcome || !timeframe || !birthDate || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Default to 12:00 PM if no birth time provided
    const finalBirthTime = birthTime || '12:00';
    
    console.log(`Generating action timeline for: ${outcome}`);
    console.log(`Timeframe: ${timeframe} months`);
    console.log(`Birth time: ${finalBirthTime}`);
    
    // Calculate natal chart with the final birth time
    console.log('Calculating natal chart...');
    const natalChart = calculateNatalChart(birthDate, finalBirthTime, latitude, longitude);
    
    // Calculate transits for the specified timeframe (convert months to days)
    const days = Math.floor(timeframe * 30.5);
    console.log(`Calculating transits for ${days} days starting from today...`);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const allTransits = calculateTransitAspects(natalChart, todayStr, days);
    
    console.log(`Found ${allTransits.length} total transits`);
    
    // Select most significant transits (spread across the timeline)
    const numTransits = Math.min(15, Math.max(8, Math.floor(timeframe * 3)));
    const significantTransits = selectSignificantTransits(allTransits, numTransits);
    
    console.log(`Selected ${significantTransits.length} significant transits`);
    
    // Generate action timeline
    console.log('Generating action plan...');
    const actions = await generateActionTimeline(
      outcome, 
      context || "No additional context provided", 
      availableResources || "No specific resources mentioned",
      preferredApproach || "balanced",
      timeframe, 
      significantTransits
    );
    
    // Generate timeline affirmations (1 per day for entire timeline)
    console.log('Generating timeline affirmations...');
    const totalDays = timeframe * 30;
    const timelineAffirmations = await generateTimelineAffirmations(totalDays, outcome, context, significantTransits);
    
    const calculationTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`Complete! Generated ${actions.length} actions and ${timelineAffirmations.length} affirmations in ${calculationTime} seconds`);
    
    res.json({
      actions,
      timelineAffirmations,
      summary: {
        totalTransits: allTransits.length,
        actionsGenerated: actions.length,
        totalDays: totalDays,
        calculationTime: `${calculationTime} seconds`
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ephemerisPath });
});

// Add this new endpoint after your existing endpoints
app.get('/api/geocode', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EternionApp/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match your frontend interface
    const suggestions = data.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon
    }));
    
    res.json(suggestions);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Location search failed' });
  }
});

// API endpoint to record daily affirmation confirmation and award points
app.post('/api/affirm', requireAuth, async (req, res) => {
  try {
    const { generation_id, affirmation_index, affirmation_text } = req.body;
    
    if (!generation_id || affirmation_index === undefined) {
      return res.status(400).json({ error: 'Generation ID and affirmation index are required' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if user already affirmed today's affirmation for this timeline
    const { data: existingAffirmation, error: checkError } = await supabase
      .from('daily_affirmations')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('timeline_id', generation_id)
      .eq('date', today)
      .single();

    if (existingAffirmation && !checkError) {
      if (existingAffirmation.affirmed) {
        return res.json({ 
          success: true, 
          message: 'Already affirmed today\'s affirmation!',
          points_awarded: 0,
          already_affirmed: true
        });
      } else {
        // Update existing record to mark as affirmed
        const pointsAwarded = 5; // 5 points per daily affirmation
        
        const { error: updateError } = await supabase
          .from('daily_affirmations')
          .update({
            affirmed: true,
            affirmed_at: new Date().toISOString(),
            points_awarded: pointsAwarded,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAffirmation.id);

        if (updateError) {
          console.error('Error updating daily affirmation:', updateError);
          return res.status(500).json({ error: 'Failed to record affirmation' });
        }

        // Award points
        await awardPoints(req.user.id, pointsAwarded, 'daily_affirmation', `${generation_id}_${today}`);

        return res.json({ 
          success: true, 
          message: 'Daily affirmation recorded!',
          points_awarded: pointsAwarded,
          already_affirmed: false
        });
      }
    }

    // Create new daily affirmation record
    const pointsAwarded = 5; // 5 points per daily affirmation
    
    const { data: newAffirmation, error: insertError } = await supabase
      .from('daily_affirmations')
      .insert({
        user_id: req.user.id,
        timeline_id: generation_id,
        affirmation_index: affirmation_index,
        affirmation_text: affirmation_text,
        date: today,
        affirmed: true,
        affirmed_at: new Date().toISOString(),
        points_awarded: pointsAwarded
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating daily affirmation:', insertError);
      return res.status(500).json({ error: 'Failed to record affirmation' });
    }

    // Award points
    await awardPoints(req.user.id, pointsAwarded, 'daily_affirmation', `${generation_id}_${today}`);

    res.json({ 
      success: true, 
      message: 'Daily affirmation recorded!',
      points_awarded: pointsAwarded,
      already_affirmed: false
    });

  } catch (error) {
    console.error('Error recording affirmation:', error);
    res.status(500).json({ error: 'Failed to record affirmation' });
  }
});

// Helper function to award points
async function awardPoints(userId, points, source, description) {
  try {
    // Create points transaction
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: points,
        type: 'earned',
        source: source,
        description: description
      });

    if (pointsError) {
      console.error('Error creating points transaction:', pointsError);
      return;
    }

    // Update user's total points
    try {
      const { data: userPoints, error: fetchError } = await supabase
        .from('user_points')
        .select('total_points, lifetime_points')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user points:', fetchError);
        return;
      }

      const currentTotal = userPoints?.total_points || 0;
      const currentLifetime = userPoints?.lifetime_points || 0;
      const newTotal = currentTotal + points;
      const newLifetime = currentLifetime + points;

      if (userPoints) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            total_points: newTotal,
            lifetime_points: newLifetime,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating user points:', updateError);
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            total_points: points,
            lifetime_points: points
          });

        if (insertError) {
          console.error('Error creating user points record:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in points update process:', error);
    }
  } catch (error) {
    console.error('Error in points award process:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🌟 Eternion Action Timeline Generator`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📂 Ephemeris path: ${ephemerisPath}\n`);
});
