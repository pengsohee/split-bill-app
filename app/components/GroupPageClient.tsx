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
        <div style={{ 
            ...fontStyle, 
            padding: '24px', 
            maxWidth: '680px', 
            margin: '0 auto', 
            background: 'var(--background)',
            minHeight: '100vh'
        }}>
            {/* Header Section */}
            <Card style={{ 
                marginBottom: '24px', 
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Typography.Title level={2} style={{ 
                            ...fontStyle, 
                            margin: 0, 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {group.name}
                        </Typography.Title>
                        <Button 
                            type="link" 
                            icon={<LinkOutlined />} 
                            onClick={handleShare} 
                            style={{ 
                                padding: 0, 
                                height: 'auto',
                                color: '#6b7280',
                                fontSize: '14px'
                            }}
                        >
                            Copy Share Link
                        </Button>
                    </Col>
                    <Col>
                        <Tooltip title="Add New Expense">
                            <Button 
                                type="primary" 
                                shape="circle" 
                                icon={<PlusOutlined />} 
                                size="large" 
                                onClick={() => setIsExpenseModalVisible(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                }}
                            />
                        </Tooltip>
                    </Col>
                </Row>
            </Card>

            {/* Summary Section */}
            <Card style={{ 
                marginBottom: '24px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
                <Typography.Title level={4} style={{ 
                    ...fontStyle, 
                    marginBottom: '16px',
                    color: 'var(--foreground)'
                }}>
                    💸 Settlement Summary
                </Typography.Title>
                {summaryData.length > 0 ? (
                    <Table
                        columns={summaryColumns}
                        dataSource={summaryData}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                        style={{ 
                            background: 'transparent'
                        }}
                    />
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '24px',
                        color: '#10b981',
                        fontSize: '16px'
                    }}>
                        🎉 All settled up! No pending payments.
                    </div>
                )}
            </Card>

            {/* Members Section */}
            <Card style={{ 
                marginBottom: '24px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
                <Typography.Title level={4} style={{ 
                    ...fontStyle, 
                    marginBottom: '16px',
                    color: 'var(--foreground)'
                }}>
                    👥 Members ({participants.length})
                </Typography.Title>
                <Space size="middle" wrap>
                    {participants.map((p, index) => (
                        <Tooltip key={p.id} title={`Edit ${p.name}`}>
                            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => openEditModal(p)}>
                                <Avatar 
                                    size={64} 
                                    style={{ 
                                        background: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    {p.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: '#6b7280',
                                    maxWidth: '64px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {p.name}
                                </div>
                            </div>
                        </Tooltip>
                    ))}
                    <Tooltip title="Add New Member">
                        <div style={{ textAlign: 'center' }}>
                            <Button 
                                shape="circle" 
                                icon={<PlusOutlined />} 
                                size="large" 
                                onClick={() => setIsMemberModalVisible(true)}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'var(--border-light)',
                                    border: '2px dashed var(--border)',
                                    color: '#6b7280'
                                }}
                            />
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#6b7280',
                                marginTop: '8px'
                            }}>
                                Add
                            </div>
                        </div>
                    </Tooltip>
                </Space>
            </Card>

            {/* History Section */}
            <Card style={{ 
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
                <Typography.Title level={4} style={{ 
                    ...fontStyle, 
                    marginBottom: '16px',
                    color: 'var(--foreground)'
                }}>
                    📋 Recent Expenses
                </Typography.Title>
                {expenses.length > 0 ? (
                    <List
                        dataSource={expenses}
                        renderItem={(expense: any) => (
                            <List.Item style={{ padding: '12px 0', border: 'none' }}>
                                <Link href={`/expense/${expense.id}`} passHref legacyBehavior>
                                    <a style={{ width: '100%', textDecoration: 'none' }}>
                                        <Card 
                                            hoverable
                                            style={{
                                                border: '1px solid var(--border-light)',
                                                borderRadius: '12px',
                                                background: 'var(--background)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            bodyStyle={{ padding: '16px' }}
                                        >
                                            <Row justify="space-between" align="middle">
                                                <Col flex="1">
                                                    <Typography.Text strong style={{ 
                                                        ...fontStyle,
                                                        fontSize: '16px',
                                                        color: 'var(--foreground)',
                                                        display: 'block',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {expense.description}
                                                    </Typography.Text>
                                                    <Typography.Text style={{ 
                                                        color: '#6b7280',
                                                        fontSize: '14px'
                                                    }}>
                                                        Paid by {participants.find(p => p.id === expense.paid_by_id)?.name || 'Unknown'}
                                                    </Typography.Text>
                                                    <Typography.Text style={{ 
                                                        color: '#9ca3af',
                                                        fontSize: '12px',
                                                        display: 'block'
                                                    }}>
                                                        {new Date(expense.expense_date).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </Typography.Text>
                                                </Col>
                                                <Col>
                                                    <Typography.Text className="currency-text" style={{
                                                        fontSize: '18px',
                                                        fontWeight: '700',
                                                        color: '#10b981'
                                                    }}>
                                                        Rp {parseFloat(expense.amount).toLocaleString('id-ID')}
                                                    </Typography.Text>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </a>
                                </Link>
                            </List.Item>
                        )}
                    />
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '48px 24px',
                        color: '#6b7280'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                        <Typography.Text style={{ fontSize: '16px', color: '#6b7280' }}>
                            No expenses yet. Add your first expense to get started!
                        </Typography.Text>
                    </div>
                )}
            </Card>

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