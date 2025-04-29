// Script to test direct database access
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role to bypass RLS
);

async function testDatabaseAccess() {
  console.log('Testing database access...');
  
  // Test 1: Check if community_posts table exists
  console.log('Test 1: Checking if community_posts table exists...');
  const { data: tableData, error: tableError } = await supabase
    .from('community_posts')
    .select('id')
    .limit(1);
  
  if (tableError) {
    console.error('Error accessing community_posts table:', tableError);
    console.log('This suggests the table might not exist or you have permission issues.');
  } else {
    console.log('✅ Successfully accessed community_posts table');
    console.log('Found records:', tableData.length);
  }
  
  // Test 2: Try to insert a test record
  console.log('\nTest 2: Trying to insert a test record...');
  const testPost = {
    id: `test-${Date.now()}`,
    user_id: '00000000-0000-0000-0000-000000000000', // A dummy user ID
    content: 'This is a test post from the script',
    created_at: new Date().toISOString()
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('community_posts')
    .insert(testPost)
    .select();
  
  if (insertError) {
    console.error('Error inserting test record:', insertError);
    console.log('This suggests you might have permission issues or missing required fields.');
  } else {
    console.log('✅ Successfully inserted test record:', insertData);
    
    // Clean up the test record
    console.log('\nCleaning up test record...');
    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', testPost.id);
      
    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
    } else {
      console.log('✅ Successfully cleaned up test record');
    }
  }
}

testDatabaseAccess().catch(console.error); 