import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testRpcDirectly() {
    console.log('Testing RPC function directly...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const testEmail = `test.${Date.now()}@example.com`;
    const testData = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: testEmail,
        password: 'testpassword123',
        user_metadata: {
            full_name: 'Test User',
            role: 'staff',
            schoolId: 'test-school-123',
            staff_id: `test-staff-${Date.now()}`,
            phone_number: '1234567890'
        }
    };

    try {
        console.log('Testing with data:', JSON.stringify(testData, null, 2));
        
        // Call the RPC function directly
        const { data, error } = await supabase.rpc('create_user_with_profile', {
            user_data: testData
        });

        if (error) {
            console.error('❌ RPC Error:', error);
            return;
        }

        console.log('✅ RPC Response:', data);
        
        // Verify the user was created in the users table
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', testEmail)
            .single();
            
        if (userError) {
            console.error('❌ Error fetching created user:', userError);
            return;
        }
        
        console.log('✅ User record verified in database');
        console.log('User details:', user);
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the test
testRpcDirectly().catch(console.error);
