import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test staff creation
async function testStaffCreation() {
    console.log('Testing staff creation...');
    
    const testData = {
        fullName: 'Test Staff',
        email: `test.staff.${Date.now()}@example.com`,
        role: 'staff',
        phoneNumber: '1234567890',
        specialization: 'Mathematics'
    };

    try {
        const response = await supabase.rpc('create_user_with_profile', {
            user_data: JSON.stringify({
                email: testData.email,
                password: 'testpassword123',
                user_metadata: {
                    full_name: testData.fullName,
                    role: testData.role,
                    schoolId: 'test-school-123',
                    staff_id: `test-staff-${Date.now()}`,
                    phone_number: testData.phoneNumber,
                    specialization: testData.specialization
                }
            })
        });

        if (response.error) {
            console.error('Error creating staff:', response.error);
            return;
        }

        console.log('✅ Staff created successfully!');
        console.log('Response:', response.data);
        
        // Verify the user was created
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', testData.email)
            .single();
            
        if (userError) {
            console.error('Error fetching created user:', userError);
            return;
        }
        
        console.log('✅ User record verified in database');
        console.log('User details:', user);
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run the test
testStaffCreation().catch(console.error);
