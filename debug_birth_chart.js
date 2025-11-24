require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testBirthChart() {
  try {
    console.log('🔍 Testing birth chart functionality...');
    
    // Test user login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'taren@sauma.ai',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('✅ User authenticated:', authData.user.email);

    // Test birth chart data
    const birthChartData = {
      birthDate: '1990-06-15',
      birthTime: '14:30',
      latitude: 40.7128,
      longitude: -74.0060,
      location: 'New York, NY, USA'
    };

    console.log('📊 Birth chart data:', birthChartData);

    // Test if we can access the birth_charts table
    const { data: existingCharts, error: selectError } = await supabase
      .from('birth_charts')
      .select('*')
      .eq('user_id', authData.user.id);

    if (selectError) {
      console.error('❌ Select error:', selectError);
    } else {
      console.log('✅ Can access birth_charts table, existing charts:', existingCharts?.length || 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBirthChart();
