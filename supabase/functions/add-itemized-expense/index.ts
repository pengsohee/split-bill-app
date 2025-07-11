// app/api/expenses/create-itemized/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define CORS headers for security
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // For production, replace '*' with your Next.js app's domain
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export async function POST(req: NextRequest) {
  // Handle preflight OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: corsHeaders })
    }

    try {
    const { expenseData, items } = await req.json()

    // Create an admin client using environment variables
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    )
    
    // Call the PostgreSQL function
    const { error } = await supabaseAdmin.rpc('create_itemized_expense', {
        p_group_id: expenseData.groupId,
        p_description: expenseData.description,
        p_amount: expenseData.amount,
        p_paid_by_id: expenseData.paidById,
        p_expense_date: expenseData.expenseDate,
        p_items: items,
    })

    if (error) {
        console.error(error)
        throw new Error('Database transaction failed: ' + error.message)
    }

    // Return success response with CORS headers
    return NextResponse.json(
        { message: "Expense created successfully" },
        { headers: corsHeaders, status: 200 }
    )
    } catch (error: any) {
        // Return error response with CORS headers
        return NextResponse.json(
            { error: error.message },
            { headers: corsHeaders, status: 500 }
        )
    } 
}

// Add OPTIONS method handler for CORS preflight
export async function OPTIONS() {
    return NextResponse.json(
        {},
        { headers: corsHeaders, status: 200 }
    )
}