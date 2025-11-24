import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }
    
    // Google Places API Autocomplete
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=AIzaSyBH3F71qjovxSMSlz-ZD69SobyTX4rsebU`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }
    
    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json([]);
    }
    
    // Get place details for each suggestion to get coordinates
    const suggestions = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction: any) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=AIzaSyBH3F71qjovxSMSlz-ZD69SobyTX4rsebU`
          );
          const details = await detailsResponse.json();
          
          return {
            display_name: prediction.description,
            lat: details.result.geometry.location.lat.toString(),
            lon: details.result.geometry.location.lng.toString()
          };
        } catch (error) {
          console.error('Error getting place details:', error);
          Sentry.captureException(error, {
            tags: {
              error_type: 'geocode_place_details',
            },
          });
          return null;
        }
      })
    );
    
    // Filter out any failed requests
    const validSuggestions = suggestions.filter(suggestion => suggestion !== null);
    
    return NextResponse.json(validSuggestions);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    Sentry.captureException(error, {
      tags: {
        error_type: 'geocoding',
      },
      extra: {
        query: searchParams.get('query'),
      },
    });
    return NextResponse.json({ error: 'Location search failed' }, { status: 500 });
  }
}
