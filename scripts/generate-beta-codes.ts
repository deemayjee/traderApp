const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables. Please check your .env.local file.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateAlphanumericCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function generateBetaCodes(count: number = 50) {
  console.log(`Generating ${count} beta access codes...`)
  
  for (let i = 0; i < count; i++) {
    // Generate a random 6-character alphanumeric code
    const code = generateAlphanumericCode()
    
    try {
      // Insert the code into the database
      const { error } = await supabase
        .from('beta_access_codes')
        .insert([{
          code,
          is_active: true
        }])

      if (error) {
        console.error(`Error creating code ${code}:`, error)
      } else {
        console.log(`✅ Created code: ${code}`)
      }
    } catch (error) {
      console.error(`Error creating code ${code}:`, error)
    }
  }
  
  console.log('Code generation complete!')
}

// Run the code generation
generateBetaCodes().catch(console.error) 