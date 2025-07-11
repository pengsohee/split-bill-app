import { supabase } from '@/lib/supabaseClient';
import ExpenseDetailClient from '@/app/components/ExpenseDetailClient'; 

const fontStyle = { fontFamily: "'Lexend Deca', sans-serif" };

// Define the detailed types for our fetched data
type ExpenseDetail = {
    id: number;
    description: string;
    amount: string;
    expense_date: string;
    split_method: 'equally' | 'itemized';
    participants: { name: string }; // The person who paid
    expense_equal_participants: { participants: { name: string } }[];
    expense_items: {
        id: number;
        description: string;
        price: string;
        expense_item_participants: { participants: { name: string } }[];
    }[];
    group_id: string;
};

interface PageProps {
    params: { expenseId: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}


// This is an async Server Component that fetches data before rendering
export default async function ExpenseDetailPage(props: {
    params: Promise<{ expenseId: string }>
}) {
    const params = await props.params;
    const expenseId = params.expenseId;

    // Fetch the specific expense and all its related data from Supabase
    const { data: expense, error } = await supabase
        .from('expenses')
        .select(`
            *,
            participants!paid_by_id ( name ),
            expense_equal_participants (
                participants ( name )
            ),
            expense_items (
                *,
                expense_item_participants (
                    participants ( name )
                )
            )
        `)
        .eq('id', expenseId)
        .single();

    if (error) {
        console.error("Supabase error fetching expense detail:", error);
        return <div style={{...fontStyle, padding: '40px', textAlign: 'center'}}>Error: {error.message}</div>;
    }

    if (!expense) {
        return <div style={{ fontFamily: "'Lexend Deca', sans-serif", padding: '40px', textAlign: 'center'}}>Expense with ID {expenseId} could not be found.</div>;
    }    
    
    const expenseDetail = expense as ExpenseDetail;

    return <ExpenseDetailClient expenseDetail={expenseDetail} />;
}
