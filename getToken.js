// This script will help you get a JWT token from Supabase
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Anon Key in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function getJWT(email, password) {
  try {
    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // If sign in fails, try to sign up first
      console.log('Sign in failed, trying to sign up...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }
      
      console.log('User created successfully, please check your email for verification.');
      console.log('After verifying, run this script again to get your JWT token.');
      return;
    }

    // Get the JWT token from the session
    const token = data.session?.access_token;
    
    if (!token) {
      throw new Error('No token found in session');
    }

    console.log('\n--- Your JWT Token ---');
    console.log(token);
    console.log('---------------------\n');
    console.log('Use this token in your Authorization header like this:');
    console.log(`Authorization: Bearer ${token}\n`);

    return token;
  } catch (error) {
    console.error('Error getting JWT token:', error.message);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node getToken.js <email> <password>');
  console.log('Example: node getToken.js user@example.com yourpassword');
  process.exit(1);
}

getJWT(email, password);
