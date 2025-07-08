"use client";

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AddExpense from '@/app/components/AddExpense';
import {
    Typography,
    Button,
    Avatar,
    List,
    Card,
    Row,
    Col,
    Modal,
    Form,
    Input,
    message,
    Tooltip,
    Table,
    Space,
    Popconfirm
} from 'antd';
import { PlusOutlined, UserOutlined, LinkOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';


// Define the types for your data
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

interface GroupPageClientProps {
    groupId: string;
    initialData: InitialData;
}

const fontStyle = { fontFamily: "'Lexend Deca', sans-serif" };

export default function GroupPageClient({ groupId, initialData }: GroupPageClientProps) {
    const [group] = useState(initialData.group);
    const [participants, setParticipants] = useState(initialData.participants);
    const [expenses, setExpenses] = useState(initialData.expenses);
    
    const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
    const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
    const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);

    const [newMemberName, setNewMemberName] = useState('');
    const [editedMemberName, setEditedMemberName] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const refreshData = async () => {
        const { data: expensesData } = await supabase.from('expenses').select(`*, expense_equal_participants ( participant_id ), expense_items ( *, expense_item_participants ( participant_id ) )`).eq('group_id', groupId).order('expense_date', { ascending: false });

        const { data: participantsData } = await supabase
            .from('participants')
            .select('*')
            .eq('group_id', groupId);
        
        if (expensesData) setExpenses(expensesData as unknown as Expense[]);
        if (participantsData) setParticipants(participantsData);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        message.success('URL Copied to clipboard!'); // antd's notification system
    };
    
    const handleAddParticipant = async () => {
        if (!newMemberName.trim()) {
            message.error("Please enter a member's name.");
            return;
        }
        setIsSubmitting(true);
        const { error } = await supabase.from('participants').insert({ group_id: groupId, name: newMemberName.trim() });
        if (error) {
            message.error("Failed to add participant.");
        } else {
            setNewMemberName('');
            setIsMemberModalVisible(false);
            await refreshData();
        }
        setIsSubmitting(false);
    };

    const handleRemoveParticipant = async () => {
        if (!selectedParticipant) return;
        setIsSubmitting(true);

        const { error } = await supabase.from('participants').delete().eq('id', selectedParticipant.id);
        if (error) {
            message.error("Failed to remove participant. They may be part of an existing expense.");
        } else {
            message.success("Participant removed.");
            setIsEditMemberModalVisible(false);
            await refreshData();
        }
        setIsSubmitting(false);
    };

    const handleEditParticipant = async () => {
        if (!selectedParticipant || !editedMemberName.trim()) {
            message.error("Name cannot be empty.");
            return;
        }
        setIsSubmitting(true);
        const { error } = await supabase.from('participants').update({ name: editedMemberName.trim() }).eq('id', selectedParticipant.id);

        if (error) {
            message.error("Failed to update participant.");
        } else {
            message.success("Participant name updated.");
            setIsEditMemberModalVisible(false);
            await refreshData();
        }
        setIsSubmitting(false);
    }

    const openEditModal = (participant: Participant) => {
        setSelectedParticipant(participant);
        setEditedMemberName(participant.name);
        setIsEditMemberModalVisible(true);
    };
    
    const handleAddExpense = async (formValues: any) => {
    // --- Data Pre-processing Step ---

    // 1. Determine the split method based on form fields
    const isItemized = formValues.items && formValues.items.length > 0;
    const splitMethod = isItemized ? 'itemized' : 'equally';

    // 2. Calculate the total amount
    // For itemized splits, sum the price of each item.
    // For equal splits, use the provided amount.
    const totalAmount = isItemized
        ? formValues.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0)
        : parseFloat(formValues.amount);

    // 3. Create a clean data object with a formatted date
    const cleanExpenseData = {
        description: formValues.description,
        paidById: formValues.paidById,
        expenseDate: formValues.expenseDate ? formValues.expenseDate.toISOString() : new Date().toISOString(), // Converts date object to a string
        amount: totalAmount,
        splitMethod: splitMethod,
        participants: formValues.participants, // For equal split
        items: formValues.items // For itemized split
    };

    // --- End of Data Pre-processing ---

    try {
        if (cleanExpenseData.splitMethod === 'equally') {
            // Logic for equally split expenses
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    group_id: groupId,
                    description: cleanExpenseData.description,
                    amount: cleanExpenseData.amount,
                    paid_by_id: cleanExpenseData.paidById,
                    expense_date: cleanExpenseData.expenseDate,
                    split_method: 'equally',
                })
                .select('id')
                .single();

            if (expenseError) throw expenseError;

            const links = cleanExpenseData.participants.map((pId: number) => ({ expense_id: expense.id, participant_id: pId }));
            await supabase.from('expense_equal_participants').insert(links);

        } else { // 'itemized'
            // Logic for itemized expenses using the Edge Function
            const { error } = await supabase.functions.invoke('add-itemized-expense', {
                body: {
                    expenseData: {
                        groupId,
                        description: cleanExpenseData.description,
                        amount: cleanExpenseData.amount, // Pass the new calculated total
                        paidById: cleanExpenseData.paidById,
                        expenseDate: cleanExpenseData.expenseDate
                    },
                    items: cleanExpenseData.items.map((item: any) => ({
                        description: item.description,
                        price: item.price,
                        participants: item.participants
                    }))
                }
            });
            if (error) throw error;
        }

        message.success('Expense added successfully!');
        await refreshData(); // Refresh UI

    } catch (error: any) {
        console.error("Error adding expense:", error);
        message.error(error.message || 'Failed to add expense.');
    }
};

    const handleDeleteExpense = async (expenseId: number) => {
        // ... (no changes here)
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) console.error(error);
        else setExpenses(expenses.filter(e => e.id !== expenseId));
    };

    // The final debt calculation logic
    const debtSummary = useMemo(() => {
        if (!participants?.length || !expenses?.length) return [];
        const balances: { [key: number]: number } = {};

        participants.forEach(p => { balances[p.id] = 0; });
        
        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount);
            // The payer is credited the full amount
            if (expense.paid_by_id) {
                balances[expense.paid_by_id] += amount;
            }

            if (expense.split_method === 'equally' && expense.expense_equal_participants) {
                const share = amount / expense.expense_equal_participants.length;
                expense.expense_equal_participants.forEach(p => { balances[p.participant_id] -= share; });
            } else if (expense.split_method === 'itemized' && expense.expense_items) {
                expense.expense_items.forEach(item => {
                    const itemPrice = parseFloat(item.price);
                    if (item.expense_item_participants?.length > 0) {
                        const share = itemPrice / item.expense_item_participants.length;
                        item.expense_item_participants.forEach(p => { balances[p.participant_id] -= share; });
                    }
                });
            }
        });

        // Separate into debtors and creditors
        const creditors = Object.entries(balances).filter(([, bal]) => bal > 0).map(([id, bal]) => ({ id: Number(id), amount: bal }));
        const debtors = Object.entries(balances).filter(([, bal]) => bal < 0).map(([id, bal]) => ({ id: Number(id), amount: -bal }));
        
        const transactions = [];
        // Greedy algorithm to simplify debts
        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const payment = Math.min(debtor.amount, creditor.amount);

            const debtorName = participants.find(p => p.id === debtor.id)?.name || 'Unknown';
            const creditorName = participants.find(p => p.id === creditor.id)?.name || 'Unknown';
            
            transactions.push(`${debtorName} owes ${creditorName} Rp ${payment.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            
            debtor.amount -= payment;
            creditor.amount -= payment;
            
            // Remove settled parties
            if (debtor.amount < 0.01) debtors.shift();
            if (creditor.amount < 0.01) creditors.shift();
        }
        return transactions;
    }, [participants, expenses]);

    const summaryColumns = [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                width: '33.33%'
            },
            {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (text: string) => `Rp ${text}`,
                width: '33.33%'
            },
            {
                title: 'Paid By',
                dataIndex: 'paid_by',
                key: 'paid_by',
                width: '33.33%'
            },
            
        ];

    const summaryData = debtSummary.map((s, i) => {
        const [name, rest] = s.split(' owes ');
        const [paid_by, amount] = rest.split(' Rp ');
        return { key: i, name, paid_by, amount };
    });

    if (!group) return <div className="text-center p-10 font-semibold text-xl text-red-500">Group not found.</div>;

    // The entire JSX from your old page.tsx goes here
    return (
        <div style={{ ...fontStyle, padding: '24px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF' }}>
            {/* Header Section */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Col>
                    <Typography.Title level={3} style={{ ...fontStyle, margin: 0 }}>
                        {group.name}
                    </Typography.Title>
                    <Button type="link" icon={<LinkOutlined />} onClick={handleShare} style={{ padding: 0, height: 'auto' }}>
                        Copy Share Link
                    </Button>
                </Col>
                <Col>
                    <Tooltip title="Add New Expense">
                        <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={() => setIsExpenseModalVisible(true)} />
                    </Tooltip>
                </Col>
            </Row>

            {/* Summary Section */}
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={4} style={fontStyle}>Summary</Typography.Title>
                <Table
                    columns={summaryColumns}
                    dataSource={summaryData}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                />
            </div>

            {/* Members Section */}
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={4} style={fontStyle}>Members</Typography.Title>
                <Space size="middle" wrap>
                    {participants.map(p => (
                        <Tooltip key={p.id} title={`Edit ${p.name}`}>
                            <Avatar 
                                size="large" 
                                icon={<UserOutlined />} 
                                onClick={() => openEditModal(p)}
                                style={{ cursor: 'pointer' }}
                            />
                        </Tooltip>
                    ))}
                    <Tooltip title="Add New Member">
                        <Button shape="circle" icon={<PlusOutlined />} size="large" onClick={() => setIsMemberModalVisible(true)} />
                    </Tooltip>
                </Space>
            </div>

            {/* History Section */}
            <div>
                <Typography.Title level={4} style={fontStyle}>History</Typography.Title>
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={expenses}
                    renderItem={(expense: any) => (
                        <List.Item>
                            <Link href={`/expense/${expense.id}`} passHref legacyBehavior>
                                <a>
                                    <Card hoverable>
                                        <Card.Meta
                                            title={<span style={fontStyle}>{expense.description}</span>}
                                            description={`Paid by: ${participants.find(p => p.id === expense.paid_by_id)?.name || 'Unknown'}`}
                                        />
                                        <div style={{ textAlign: 'right', marginTop: '16px' }}>
                                            <Typography.Text strong>
                                                Total: Rp {parseFloat(expense.amount).toLocaleString('id-ID')}
                                            </Typography.Text>
                                        </div>
                                    </Card>
                                </a>
                            </Link>
                        </List.Item>
                    )}
                />
            </div>

            {/* --- Modals --- */}
            <Modal
                title="Add New Expense"
                open={isExpenseModalVisible}
                onCancel={() => setIsExpenseModalVisible(false)}
                footer={null} // Footer is handled by the form component
                destroyOnHidden
            >
                <AddExpense participants={participants} onAddExpense={handleAddExpense} />
            </Modal>

            <Modal
                title="Add New Member"
                open={isMemberModalVisible}
                onOk={handleAddParticipant}
                onCancel={() => setIsMemberModalVisible(false)}
                confirmLoading={isSubmitting}
            >
                
                <Input
                    placeholder="Enter member's name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onPressEnter={handleAddParticipant}
                />
            </Modal>

            <Modal 
                title={`Edit ${selectedParticipant?.name}`} 
                open={isEditMemberModalVisible} 
                onCancel={() => setIsEditMemberModalVisible(false)}
                footer={[
                    <Popconfirm
                        key="delete"
                        title="Are you sure?"
                        description="This will permanently remove this member from the group."
                        onConfirm={() => handleRemoveParticipant()}
                        okText="Yes, Remove"
                        cancelText="No"
                    >
                        <Button danger loading={isSubmitting}>Delete Member</Button>
                    </Popconfirm>,
                    <Button key="save" type="primary" loading={isSubmitting} onClick={handleEditParticipant}>
                        Save Changes
                    </Button>,
                ]}
            >
                <Input value={editedMemberName} onChange={(e) => setEditedMemberName(e.target.value)} onPressEnter={handleEditParticipant}/>
            </Modal>
        </div>
    );
}