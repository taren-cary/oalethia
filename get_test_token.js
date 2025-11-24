// Updated get_test_token.js
require('dotenv').config(); // Add this line at the top
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function getTestToken() {
  try {
    console.log('Supabase URL:', process.env.SUPABASE_URL ? '✅ Found' : '❌ Missing');
    console.log('Anon Key:', process.env.SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'taren@sauma.ai',
      password: 'password123'
    });

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    if (data.session) {
      console.log('✅ JWT Token:');
      console.log(data.session.access_token);
      console.log('\n📋 Copy this token to your test script!');
    }
  } catch (err) {
    console.error('Failed to get token:', err);
  }
}

getTestToken();