const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testStaffCreation() {
    console.log('Testing staff creation...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const testData = {
        fullName: 'Test Staff',
        email: `test.staff.${Date.now()}@example.com`,
        role: 'staff',
        phoneNumber: '1234567890',
        specialization: 'Mathematics'
    };

    try {
        console.log('Creating staff with email:', testData.email);
        
        const userData = {
            id: '550e8400-e29b-41d4-a716-446655440000', // Example UUID, should be unique in a real scenario
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
        };

        console.log('Sending user data:', JSON.stringify(userData, null, 2));
        
        // Try using the from('rpc') method instead of the rpc() method
        const { data, error } = await supabase
            .from('rpc')
            .select('*')
            .eq('function', 'create_user_with_profile')
            .single()
            .single();
            
        if (!error) {
            const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_with_profile', {
                user_data: userData
            });
            
            if (rpcError) {
                console.error('❌ RPC Error:', rpcError);
                return { error: rpcError };
            }
            
            console.log('✅ RPC Response:', rpcData);
            return { data: rpcData };
        }

        if (error) {
            console.error('❌ Error creating staff:', error);
            return;
        }

        console.log('✅ Staff created successfully!');
        console.log('Response:', data);
        
        // Verify the user was created in the users table
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', testData.email)
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
testStaffCreation().catch(console.error);
