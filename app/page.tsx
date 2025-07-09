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
        <div className="gradient-bg" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px',
            ...fontStyle
        }}>
            <div className="glass-card" style={{
                padding: '48px 32px',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center'
            }}>
                <Space direction="vertical" size={32} style={{ width: '100%' }}>
                
                {/* Title and Subtitle */}
                <div>
                    <div style={{ 
                        fontSize: '3.5rem', 
                        fontWeight: '700', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px',
                        ...fontStyle 
                    }}>
                        💰 Patungan
                    </div>

                    <Text style={{ 
                        fontSize: '1.125rem', 
                        color: '#6b7280',
                        display: 'block',
                        marginBottom: '8px',
                        ...fontStyle 
                    }}>
                        Split bills, not friendships
                    </Text>
                    
                    <Text style={{ 
                        fontSize: '0.875rem', 
                        color: '#9ca3af',
                        ...fontStyle 
                    }}>
                        Create groups, track expenses, and settle up with ease
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
        </div>
    );
}