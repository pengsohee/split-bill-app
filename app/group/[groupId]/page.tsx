import { supabase } from '@/lib/supabaseClient';
import GroupPageClient from '@/app/components/GroupPageClient';

type Participant = { id: number; name: string; };
type Group = { id: string; name: string; };
type Expense = {
    id: number;
    description: string;
    amount: string;
    paid_by_id: number;
    expense_date: string;
    split_method: 'equally' | 'itemized';
    expense_equal_participants: { participant_id: number }[];
    expense_items: {
        id: number;
        price: string;
        expense_item_participants: { participant_id: number }[];
    }[];
};
type InitialData = {
    group: Group | null;
    participants: Participant[];
    expenses: Expense[];
};

// This is now an async Server Component. No "use client" here.
export default async function GroupPage({ params }: { params: { groupId: string } }) {
  // Accessing params directly is fine in a Server Component.
    const { groupId } = params;

    // Perform all initial data fetching on the server.
    const [groupRes, participantsRes, expensesRes] = await Promise.all([
        supabase.from('groups').select('name').eq('id', groupId).single(),
        supabase.from('participants').select('*').eq('group_id', groupId),
        supabase.from('expenses').select(`
            *,
            expense_equal_participants ( participant_id ),
            expense_items ( *, expense_item_participants ( participant_id ) )
        `).eq('group_id', groupId).order('expense_date', { ascending: false })
    ]);

    // Assemble the initial data object to pass to the client.
    const initialData: InitialData = {
        group: groupRes.data ? { id: groupId, name: groupRes.data.name } : null,
        participants: participantsRes.data ?? [],
        // We cast the fetched data to the specific Expense[] type to ensure it matches.
        expenses: (expensesRes.data as Expense[]) ?? []
    };

    // Render the Client Component with the fetched data as props.
    return <GroupPageClient groupId={groupId} initialData={initialData} />;
}