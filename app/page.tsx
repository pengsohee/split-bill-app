"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import { Input, Button, Typography, Space, Spin, message } from 'antd';

const { Title, Text } = Typography;
const fontStyle = { fontFamily: "'Lexend Deca', sans-serif" };

export default function HomePage() {
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            message.error('Please enter a group name.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
            .from('groups')
            .insert({ name: groupName.trim() })
            .select('id')
            .single();

            if (error) throw error;
            
            router.push(`/group/${data.id}`);

        } catch (error) {
            message.error('Failed to create group. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#FFFFFF', // Set background to white
            padding: '24px',
            ...fontStyle
        }}>
            <Space direction="vertical" size={24} style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
            
            {/* Title and Subtitle */}
            <div>
                <Title level={2} style={{ margin: 0, fontWeight: 'bold', color: '#1F2937', ...fontStyle }}>
                    Welcome To
                </Title>
                <Title level={2} style={{ margin: 0, marginTop: '-8px', fontWeight: 'bold', color: '#1F2937', ...fontStyle }}>
                    Patungan
                </Title>

                <Text type="secondary" style={{ fontSize: '1rem', marginTop: '-8px', ...fontStyle }}>
                    Split bill, not friendships.
                </Text>
            </div>

            {/* Group Name Input */}
            <Input
                size="large"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onPressEnter={handleCreateGroup}
                disabled={isLoading}
                style={{ borderRadius: '8px', height: '40px', ...fontStyle }}
            />
            
            {/* Create Group Button */}
            <Button
                type="primary"
                size="large"
                loading={isLoading}
                onClick={handleCreateGroup}
                style={{
                    width: '100%',
                    backgroundColor: '#6D55FF', // Matching the purple-blue color
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    ...fontStyle
                }}
            >
                {!isLoading && 'Create Group'}
            </Button>

            </Space>
        </div>
    );
}