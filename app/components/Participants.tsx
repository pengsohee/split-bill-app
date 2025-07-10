"use client";

import { UserOutlined, UserAddOutlined } from '@ant-design/icons';
import { Card, List, Avatar, Input, Button, Form } from 'antd';

type Participant = { id: number; name: string; };

interface ParticipantsProps {
    participants: Participant[];
    onAddParticipant: (name: string) => void;
}

export default function Participants({ participants, onAddParticipant }: ParticipantsProps) {
    const [form] = Form.useForm();

    const onFinish = (values: { name: string; }) => {
        onAddParticipant(values.name);
        form.resetFields();
    };    

    return (
        <Card title="Group Participants">
            <List
                itemLayout="horizontal"
                dataSource={participants}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={item.name}
                        />
                    </List.Item>
                )}
            />
            <Form form={form} onFinish={onFinish} layout="inline" style={{ marginTop: '20px' }}>
                <Form.Item name="name" rules={[{ required: true, message: 'Please input a name!' }]} style={{ flex: 1 }}>
                    <Input placeholder="New participant name..." />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} />
                </Form.Item>
            </Form>
        </Card>
    );
}