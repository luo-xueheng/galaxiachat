'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

interface ChatMessage {
    sender: 'me' | 'friend';
    content: string;
    timestamp: string;
}

export default function ChatPage() {
    const { userName } = useParams(); // 获取路由中的用户名
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: 'friend',
            content: '你好呀～',
            timestamp: '2025-05-03 10:00',
        },
        {
            sender: 'me',
            content: '嗨！最近怎么样？',
            timestamp: '2025-05-03 10:01',
        },
    ]);
    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg: ChatMessage = {
            sender: 'me',
            content: input,
            timestamp: new Date().toLocaleString(),
        };
        setMessages([...messages, newMsg]);
        setInput('');
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 16px' }}>
                <Text strong>{userName}</Text>
            </Header>

            <Content style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                <List
                    dataSource={messages}
                    renderItem={(item) => (
                        <List.Item
                            style={{
                                justifyContent: item.sender === 'me' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <Space
                                style={{
                                    maxWidth: '70%',
                                    background: item.sender === 'me' ? '#cfe9ff' : '#f5f5f5',
                                    padding: '8px 12px',
                                    borderRadius: '16px',
                                }}
                            >
                                {item.sender === 'friend' && <Avatar>{userName?.[0]?.toUpperCase()}</Avatar>}
                                <div>
                                    <div>{item.content}</div>
                                    <Text type="secondary" style={{ fontSize: '0.75em' }}>
                                        {item.timestamp}
                                    </Text>
                                </div>
                            </Space>
                        </List.Item>
                    )}
                />
                <div ref={messageEndRef} />
            </Content>

            <Footer style={{ padding: '8px 16px' }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input.TextArea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPressEnter={(e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        placeholder="输入消息..."
                    />
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
                        发送
                    </Button>
                </Space.Compact>
            </Footer>
        </Layout>
    );
}