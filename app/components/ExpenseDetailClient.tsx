"use client";

import { Card, Descriptions, List, Tag, Typography, Button, Divider } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CalendarOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import Link from 'next/link';

const fontStyle = { fontFamily: "'Lexend Deca', sans-serif" };

interface EqualParticipant {
    participants: {
        name: string;
    };
}

interface ItemParticipant {
    participants: {
        name: string;
    };
}

interface ExpenseItem {
    id: number;
    description: string;
    price: string;
    expense_item_participants: ItemParticipant[];
}

interface ExpenseDetail {
    id: number;
    description: string;
    amount: string;
    expense_date: string;
    split_method: 'equally' | 'itemized';
    participants: { name: string }; // The person who paid
    expense_equal_participants: EqualParticipant[];
    expense_items: ExpenseItem[];
    group_id: string;
}

// This is a Client Component that receives data via props
export default function ExpenseDetailClient({ expenseDetail }: { expenseDetail: ExpenseDetail | null }) {

    if (!expenseDetail) {
        return <div style={{...fontStyle, padding: '40px', textAlign: 'center'}}>Expense data is not available.</div>;
    }

    return (
        <div style={{ ...fontStyle, backgroundColor: '#f7f7f7', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Link href={`/group/${expenseDetail.group_id}`} passHref>
                    <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: '24px' }}>
                        Back to Group
                    </Button>
                </Link>

                <Card>
                    <Typography.Title level={3} style={fontStyle}>{expenseDetail.description}</Typography.Title>
                    
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label={<><UserOutlined /> Paid By</>}>
                            {expenseDetail.participants?.name || 'Unknown'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined /> Date</>}>
                            {new Date(expenseDetail.expense_date).toLocaleDateString('en-GB')}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><MoneyCollectOutlined /> Total Amount</>}>
                            <Typography.Text strong>
                                Rp {parseFloat(expenseDetail.amount).toLocaleString('id-ID')}
                            </Typography.Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Typography.Title level={4} style={{...fontStyle, marginTop: '24px'}}>Split Details</Typography.Title>

                    {expenseDetail.split_method === 'equally' && (
                        <div>
                            <Typography.Text>Split equally among:</Typography.Text>
                            <List
                                dataSource={expenseDetail.expense_equal_participants}
                                renderItem={(item: EqualParticipant) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<UserOutlined />}
                                            title={item.participants.name}
                                        />
                                        <div>
                                            Rp {(parseFloat(expenseDetail.amount) / expenseDetail.expense_equal_participants.length).toLocaleString('id-ID')}
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}

                    {expenseDetail.split_method === 'itemized' && (
                        <List
                            itemLayout="vertical"
                            dataSource={expenseDetail.expense_items}
                            renderItem={(item: ExpenseItem) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.description}
                                        description={
                                            <Typography.Text strong>
                                                Rp {parseFloat(item.price).toLocaleString('id-ID')}
                                            </Typography.Text>
                                        }
                                    />
                                    <div>
                                        {item.expense_item_participants.map((p: ItemParticipant) => (
                                            <Tag key={p.participants.name}>{p.participants.name}</Tag>
                                        ))}
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
}
