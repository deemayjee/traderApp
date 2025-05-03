import { supabase } from '@/lib/supabase'

async function generateBetaCodes(count: number = 50) {
  console.log(`Generating ${count} beta access codes...`)
  
  for (let i = 0; i < count; i++) {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    
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

// Generate 50 codes
generateBetaCodes().catch(console.error) 