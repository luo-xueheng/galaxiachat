'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space } from 'antd';
import { SendOutlined, CheckCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

interface ChatMessage {
    sender: 'me' | 'friend';
    content: string;
    timestamp: string;
    isRead?: boolean; // 新增：是否已读（可选）
}

export default function ChatPage() {

    const currentUser = localStorage.getItem("userName"); // 获取当前用户的用户名
    const currentUserToken = localStorage.getItem("token"); // 获取当前用户的token
    const { userName: friendUserName } = useParams(); // 获取路由中的用户名(好友的name)
    console.log("当前用户: ", currentUser);
    console.log("当前用户token: ", currentUserToken);
    console.log("好友: ", friendUserName);

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
            isRead: true, // 模拟已读
        },
        {
            sender: 'me',
            content: '今天有空出来玩嘛？',
            timestamp: '2025-05-03 10:05',
            isRead: false, // 模拟未读
        },
    ]);

    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const [myAvatar, setMyAvatar] = useState<string | undefined>(undefined);
    const [friendAvatar, setFriendAvatar] = useState<string | undefined>(undefined);
    
    useEffect(() => {
        const fetchAvatars = async () => {
            try {

                const fetchUserAvatar = async (userName: string): Promise<string | undefined> => {
                    const response = await fetch('/api/user/' + userName, {
                        method: 'GET',
                    });
                    
                    if (!response.ok) {
                        throw new Error('获取头像失败');
                    }

                    const data = await response.json();
                    console.log("用户头像获取成功", data.avatar);
                    return data.avatar;
                };

                const [myAvatar, friendAvatar] = await Promise.all([
                    fetchUserAvatar(currentUser!),
                    fetchUserAvatar(friendUserName as string),
                ]);

                setMyAvatar(myAvatar);
                setFriendAvatar(friendAvatar);

            } catch (err) {
                alert('无法加载头像，请检查网络或登录状态');
            }
        };

        fetchAvatars();
    }, [friendUserName, currentUser, currentUserToken]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg: ChatMessage = {
            sender: 'me',
            content: input,
            timestamp: new Date().toLocaleString(),
            isRead: false, // 默认对方未读
        };
        setMessages([...messages, newMsg]);
        setInput('');
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 16px' }}>
                <Text strong>{friendUserName}</Text>
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
                                align="end"
                                style={{
                                    maxWidth: '70%',
                                    background: item.sender === 'me' ? '#cfe9ff' : '#ffffff',
                                    padding: '8px 12px',
                                    borderRadius: '16px',
                                    /* flexDirection: 'column', */
                                    alignItems: item.sender === 'me' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {item.sender === 'friend' && <Avatar src={friendAvatar} />}
                                <div>{item.content}</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: '0.75em' }}>
                                        {item.timestamp}
                                    </Text>
                                    {item.sender === 'me' && (
                                        item.isRead ? (
                                            <CheckCircleTwoTone twoToneColor="#52c41a" title="对方已读" />
                                        ) : (
                                            <ClockCircleOutlined style={{ color: '#aaa' }} title="等待对方阅读" />
                                        )
                                    )}
                                </div>
                                {item.sender === 'me' && <Avatar src={myAvatar} />}
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