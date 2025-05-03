const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables. Please check your .env.local file.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBetaCodes() {
  console.log('Checking beta access codes...')
  
  try {
    // Get all active codes
    const { data, error } = await supabase
      .from('beta_access_codes')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching codes:', error)
      return
    }

    console.log(`Found ${data.length} active codes:`)
    data.forEach(code => {
      console.log(`Code: ${code.code}, Created at: ${code.created_at}`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

checkBetaCodes().catch(console.error) 