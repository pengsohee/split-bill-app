// Import the Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers for security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For production, replace '*' with your Next.js app's domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// The main Deno server function
Deno.serve(async (req) => {
  // This handles the preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the data from the request body
    const { expenseData, items } = await req.json()

    // Create an admin client to securely call the database function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } } // Recommended for server-side operations
    )
    
    // Call the PostgreSQL function you created earlier
    const { error } = await supabaseAdmin.rpc('create_itemized_expense', {
      p_group_id: expenseData.groupId,
      p_description: expenseData.description,
      p_amount: expenseData.amount,
      p_paid_by_id: expenseData.paidById,
      p_expense_date: expenseData.expenseDate,
      p_items: items,
    })

    if (error) {
      console.error(error);
      throw new Error('Database transaction failed: ' + error.message);
    }

    // Return a success response
    return new Response(JSON.stringify({ message: "Expense created successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Return an error response
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Use 500 for internal server errors
    })
  }
})