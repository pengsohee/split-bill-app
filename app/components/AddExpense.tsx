"use client";

import { useState } from 'react';
import { Card, Form, Input, Button, Select, DatePicker, InputNumber, Checkbox, Tabs, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import TabPane from 'antd/es/tabs/TabPane';

const { Option } = Select;

type Participant = { 
    id: number; 
    name: string; 
};

interface AddExpenseProps {
    participants: Participant[];
    onAddExpense: (expense: any) => Promise<void>;
}

export default function AddExpense({ participants, onAddExpense }: AddExpenseProps) {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('equally');

    const onFinish = (values: any) => {
        const expenseData = {
            ...values,
            split_method: activeTab,
        };
        onAddExpense(expenseData);
        form.resetFields();
    };

    const tabItems = [
        {
            key: 'equally',
            label: 'Split Equally',
            children: (
                <>
                    <Form.Item 
                        name="amount" 
                        label="Total Amount" 
                        rules={[{ required: activeTab === 'equally', message: 'Please input the total amount!' }]}
                    >
                        <InputNumber prefix="Rp" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item 
                        name="participants" 
                        label="Split Among" 
                        rules={[{ required: activeTab === 'equally', message: 'Please select participants!' }]}
                    >
                        <Checkbox.Group options={participants.map(p => ({ label: p.name, value: p.id }))} />
                    </Form.Item>
                </>
            ),
        },
        {
            key: 'itemized',
            label: 'By Item',
            children: (
                <Form.List name="items">
                    {(fields, { add, remove }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {fields.map(({ key, name, ...restField }) => (
                                <Card key={key} size="small" bodyStyle={{ padding: '16px', backgroundColor: '#fafafa' }}>
                                    <Space direction="vertical" style={{width: '100%'}}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <Form.Item {...restField} name={[name, 'description']} style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: 'Missing description' }]}>
                                                <Input placeholder="Item Description" />
                                            </Form.Item>
                                            <Form.Item {...restField} name={[name, 'price']} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Missing price' }]}>
                                                <InputNumber prefix="Rp" placeholder="Price" />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                        </div>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'participants']}
                                            rules={[{ required: true, message: 'Please select participants!' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Select
                                                mode="multiple"
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Shared by..."
                                                options={participants.map(p => ({ label: p.name, value: p.id }))}
                                            />
                                        </Form.Item>
                                    </Space>
                                </Card>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Add Item
                            </Button>
                        </div>
                    )}
                </Form.List>
            ),
        },
    ];

    // // State for 'equally' split
    // const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());

    // // State for 'itemized' split
    // const [items, setItems] = useState([{ description: '', price: '', participants: new Set<number>() }]);

    // const handleParticipantToggle = (id: number) => {
    //     setSelectedParticipants(prev => {
    //     const next = new Set(prev);
    //     if (next.has(id)) {
    //         next.delete(id);
    //     } else {
    //         next.add(id);
    //     }
    //     return next;
    //     });
    // };

    // const handleAddItem = () => {
    //     setItems([...items, { description: '', price: '', participants: new Set<number>() }]);
    // };
    
    // const handleItemChange = (index: number, field: string, value: string) => {
    //     const newItems = [...items];
    //     newItems[index] = { ...newItems[index], [field]: value };
    //     setItems(newItems);
    // };

    // const handleItemParticipantToggle = (itemIndex: number, participantId: number) => {
    //     const newItems = [...items];
    //     const participants = new Set(newItems[itemIndex].participants);
    //     if (participants.has(participantId)) {
    //         participants.delete(participantId);
    //     } else {
    //         participants.add(participantId);
    //     }
    //     newItems[itemIndex].participants = participants;
    //     setItems(newItems);
    // };

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     // Validation logic here...
        
    //     let expenseData;
    //     if (splitMethod === 'equally') {
    //     expenseData = { description, amount, paidById, expenseDate, splitMethod, participants: Array.from(selectedParticipants) };
    //     } else {
    //     const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    //     expenseData = { description, amount: totalAmount, paidById, expenseDate, splitMethod, items: items.map(item => ({...item, participants: Array.from(item.participants)})) };
    //     }
        
    //     await onAddExpense(expenseData);

    //     // Reset form state
    //     setDescription('');
    //     setAmount('');
    //     setPaidById(null);
    //     setSelectedParticipants(new Set());
    //     setItems([{ description: '', price: '', participants: new Set<number>() }]);
    // };

    // const tabItems = [
    //     {
    //         key: 'equally',
    //         label: 'Split Equally',
    //         children: (
    //             <>
    //                 <Form.Item name="amount" label="Total Amount" rules={[{ required: true }]}>
    //                     <InputNumber prefix="Rp" style={{ width: '100%' }} />
    //                 </Form.Item>
    //                 <Form.Item name="participants" label="Split Among" rules={[{ required: true }]}>
    //                     <Checkbox.Group options={participants.map(p => ({ label: p.name, value: p.id }))} />
    //                 </Form.Item>
    //             </>
    //         ),
    //     },
    //     {
    //         key: 'itemized',
    //         label: 'By Item',
    //         children: (
    //             <Form.List name="items">
    //                 {(fields, { add, remove }) => (
    //                     <>
    //                         {fields.map(({ key, name, ...restField }) => (
    //                             <div key={key} style={{ display: 'flex', marginBottom: 8, gap: 8 }}>
    //                                 <Form.Item {...restField} name={[name, 'description']} style={{ flex: 1 }} rules={[{ required: true }]}>
    //                                     <Input placeholder="Item Description" />
    //                                 </Form.Item>
    //                                 <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true }]}>
    //                                     <InputNumber prefix="Rp" placeholder="Price" />
    //                                 </Form.Item>
    //                                 <MinusCircleOutlined onClick={() => remove(name)} />
    //                             </div>
    //                         ))}
    //                         <Form.Item>
    //                             <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
    //                                 Add Item
    //                             </Button>
    //                         </Form.Item>
    //                     </>
    //                 )}
    //             </Form.List>
    //         ),
    //     },
    // ];

    return (
        // The Card component is now used for styling the form container
        <Card variant="borderless" bodyStyle={{padding: '24px 0 0 0'}}>
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="paidById" label="Paid By" rules={[{ required: true }]}>
                    <Select placeholder="Select who paid">
                        {participants.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="expenseDate" label="Date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                {/* The Tabs component now uses the `items` prop */}
                <Tabs defaultActiveKey="equally" onChange={setActiveTab} items={tabItems} />

                <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" block>Add Expense</Button>
                </Form.Item>
            </Form>
        </Card>
    );
}