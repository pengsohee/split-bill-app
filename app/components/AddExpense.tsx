"use client";

import { useState } from 'react';
import { Card, Form, Input, Button, Select, DatePicker, InputNumber, Checkbox, Tabs, Space, Row, Col, Avatar } from 'antd';
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

    return (
        <div style={{ padding: '8px 0' }}>
            <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please enter a description' }]}>
                    <Input 
                        placeholder="What did you spend on?"
                        style={{
                            borderRadius: '8px',
                            padding: '12px'
                        }}
                    />
                </Form.Item>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="paidById" label="Paid By" rules={[{ required: true, message: 'Please select who paid' }]}>
                            <Select 
                                placeholder="Select who paid"
                                style={{ borderRadius: '8px' }}
                            >
                                {participants.map(p => (
                                    <Option key={p.id} value={p.id}>
                                        <Space>
                                            <Avatar size="small" style={{ background: `hsl(${(p.id * 137.5) % 360}, 70%, 60%)` }}>
                                                {p.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            {p.name}
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="expenseDate" label="Date" rules={[{ required: true, message: 'Please select a date' }]}>
                            <DatePicker 
                                style={{ width: '100%', borderRadius: '8px' }}
                                placeholder="Select date"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Split Method" style={{ marginBottom: '16px' }}>
                    <Tabs 
                        defaultActiveKey="equally" 
                        onChange={setActiveTab} 
                        items={tabItems}
                        style={{
                            marginTop: '8px'
                        }}
                    />
                </Form.Item>

                <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        block 
                        size="large"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            height: '48px',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        Add Expense
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}