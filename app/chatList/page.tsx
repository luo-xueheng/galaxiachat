'use client'

import React, { useState, useEffect } from 'react';
import { List, Avatar, Tabs, Badge, Button, Dropdown, MenuProps, message } from 'antd';
import {
    TeamOutlined,
    PlusOutlined,
    EllipsisOutlined,
    BellOutlined,
    BellFilled,
    UserOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface Conversation {
    conversation_id: number;
    conversation_name: string;
    is_group: boolean;
    unread_count: number;
    is_muted: boolean;
    updated_at: string;
    last_message?: string;
    avatar?: string; // 新增可选头像字段
    original_name?: string; // 新增字段，保存原始会话名称
}

interface UserResponse {
    avatar: string;
    // 其他用户信息字段...
}

interface ApiResponse {
    code: number;
    info: string;
    conversations: Conversation[];
}

const ChatListPage: React.FC = () => {
    const router = useRouter();
    const currentUser = localStorage.getItem("userName"); // 获取当前用户的用户名
    const token = localStorage.getItem("token"); // 获取当前用户的token
    const [activeTab, setActiveTab] = useState<string>('private');
    const [chatList, setChatList] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // 获取用户头像
    const fetchUserAvatar = async (userName: string): Promise<string | undefined> => {
        try {
            const response = await fetch(`/api/user/${userName}`, {
                method: 'GET',
                headers: {
                    Authorization: token,
                },
            });

            if (!response.ok) {
                throw new Error('获取头像失败');
            }

            const data: UserResponse = await response.json();
            return data.avatar;
        } catch (error) {
            console.error('获取用户头像出错:', error);
            return undefined;
        }
    };

    // 处理私聊会话名称，提取对方用户名
    const getPrivateChatPartner = (conversationName: string): string | null => {
        if (!conversationName.includes(' ↔ ')) return null;
        const names = conversationName.split(' ↔ ');
        return names.find(name => name !== currentUser) || null;
    };


    // 获取并设置头像
    const fetchAndSetAvatars = async (conversations: Conversation[]) => {
        const updatedConversations = await Promise.all(
            conversations.map(async (conv) => {
                if (conv.is_group) {
                    return { ...conv, avatar: undefined }; // 群聊使用默认图标
                }

                const partnerName = getPrivateChatPartner(conv.conversation_name);
                if (!partnerName) {
                    return { ...conv, avatar: undefined };
                }

                const avatar = await fetchUserAvatar(partnerName);
                return { ...conv, avatar };
            })
        );

        setChatList(updatedConversations);
    };

    const fetchConversations = async () => {
        try {
            if (!token) {
                message.error('请先登录');
                return;
            }

            setLoading(true);
            const response = await fetch('/api/conversation_unread_counts/', {
                method: 'GET',
                headers: {
                    Authorization: token,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();
            /*
            if (data.code === 0) {
                const processedConversations = data.conversations.map(conv => {
                    // 保留原始名称用于获取头像
                    const originalName = conv.conversation_name;

                    if (!conv.is_group) {
                        const names = originalName.split(' ↔ ');
                        const friendName = names.find(name => name !== currentUser) || names[0];
                        return {
                            ...conv,
                            conversation_name: friendName, // 显示用
                            original_name: originalName   // 新增字段，用于获取头像
                        };
                    }
                    return conv;
                });

                await fetchAndSetAvatars(processedConversations);
            } else {
                message.error(data.info || '获取聊天列表失败');
            }
            */
            
            if (data.code === 0) {
                await fetchAndSetAvatars(data.conversations); // 获取并设置头像
            } else {
                message.error(data.info || '获取聊天列表失败');
            }
            

        } catch (error) {
            console.error('获取聊天列表出错:', error);
            message.error('获取聊天列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && currentUser) {
            fetchConversations();
        }
    }, [token, currentUser]); // 当token变化时重新获取数据

    const handleMuteToggle = async (conversationId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/conversations/${conversationId}/mute/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    is_muted: !chatList.find(c => c.conversation_id === conversationId)?.is_muted
                }),
            });

            if (response.ok) {
                fetchConversations(); // 刷新列表
                message.success('免打扰设置已更新');
            } else {
                message.error('更新免打扰状态失败');
            }
            
        } catch (error) {
            console.error('更新免打扰状态出错:', error);
            message.error('操作失败');
        }
    };

    const handleChatItemClick = (conversationId: number) => {
        router.push(`/chat/${conversationId}`);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        }

        return date.toLocaleDateString();
    };

    const filteredChatList = chatList.filter(chat => {
        return activeTab === 'all' ||
            (activeTab === 'private' && !chat.is_group) ||
            (activeTab === 'group' && chat.is_group);
    });

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: '创建群聊',
        },
        {
            key: '2',
            label: '添加好友',
        },
    ];

    const tabItems: TabsProps['items'] = [
        {
            key: 'all',
            label: '全部',
        },
        {
            key: 'private',
            label: '私聊',
        },
        {
            key: 'group',
            label: '群聊',
        },
    ];

    return (
        <div className="chat-list-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>聊天</h2>
                <Dropdown menu={{ items }} trigger={['click']}>
                    <Button type="text" icon={<PlusOutlined />} />
                </Dropdown>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                style={{ padding: '0 16px' }}
            />

            <div style={{ flex: 1, overflow: 'auto' }}>
                <List
                    loading={loading}
                    dataSource={filteredChatList}
                    renderItem={(item) => (
                        <List.Item
                            key={item.conversation_id}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                backgroundColor: item.unread_count > 0 ? '#f9f9f9' : 'transparent',
                            }}
                            onClick={() => handleChatItemClick(item.conversation_id)}
                            actions={[
                                <div key="time" style={{ color: '#999', fontSize: 12 }}>
                                    {formatTime(item.updated_at)}
                                </div>,
                                <Button
                                    key="more"
                                    type="text"
                                    icon={<EllipsisOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        src={item.avatar} // 使用获取到的头像
                                        icon={item.is_group ? <TeamOutlined /> : <UserOutlined />}
                                        style={{ backgroundColor: item.is_group ? '#1890ff' : '#7265e6' }}
                                    />
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{item.conversation_name}</span>
                                        <div>
                                            {item.is_muted ? (
                                                <BellOutlined
                                                    style={{ color: '#999', marginRight: 8 }}
                                                    onClick={(e) => handleMuteToggle(item.conversation_id, e)}
                                                />
                                            ) : (
                                                <BellFilled
                                                    style={{ color: '#1890ff', marginRight: 8 }}
                                                    onClick={(e) => handleMuteToggle(item.conversation_id, e)}
                                                />
                                            )}
                                            {item.unread_count > 0 && (
                                                <Badge
                                                    count={item.unread_count}
                                                    style={{
                                                        backgroundColor: item.is_muted ? '#d9d9d9' : '#1890ff'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                }
                                description={
                                    <div
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            color: item.unread_count > 0 ? '#000' : '#999'
                                        }}
                                    >
                                        {item.last_message || `最后更新: ${formatTime(item.updated_at)}`}
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
};

export default ChatListPage;