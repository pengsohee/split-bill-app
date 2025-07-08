"use client";

import { List, Card, Typography, Button, Popconfirm, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

type Participant = { id: number; name: string; };
type Expense = { id: number; description: string; amount: string; paid_by_id: number; expense_date: string; };

interface ExpenseListProps {
    expenses: Expense[];
    participants: Participant[];
    onDeleteExpense: (id: number) => void;
}

export default function ExpenseList({ expenses, participants, onDeleteExpense }: ExpenseListProps) {
    const getParticipantName = (id: number) => participants.find(p => p.id === id)?.name || 'Unknown';

    return (
        <Card title={<Title level={4}>Expense History</Title>}>
            <List
                itemLayout="vertical"
                dataSource={expenses}
                renderItem={item => (
                    <List.Item
                        actions={[
                            <Popconfirm
                                title="Delete the expense"
                                description="Are you sure you want to delete this expense?"
                                onConfirm={() => onDeleteExpense(item.id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button danger type="text" icon={<DeleteOutlined />}>Delete</Button>
                            </Popconfirm>
                        ]}
                        extra={
                            <Text strong style={{ fontSize: '1.2em' }}>
                                Rp {parseFloat(item.amount).toLocaleString('id-ID')}
                            </Text>
                        }
                    >
                        <List.Item.Meta
                            title={item.description}
                            description={`Paid by ${getParticipantName(item.paid_by_id)} on ${new Date(item.expense_date).toLocaleDateString()}`}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
}