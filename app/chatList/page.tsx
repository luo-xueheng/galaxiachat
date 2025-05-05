'use client'

import React, { useState, useEffect } from 'react';
import { List, Avatar, Tabs, Badge, Button, Dropdown, MenuProps } from 'antd';
import {
    MessageOutlined,
    TeamOutlined,
    PlusOutlined,
    EllipsisOutlined,
    PushpinFilled,
    BellOutlined,
    BellFilled
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';

interface ChatItem {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    avatar: string;
    isGroup: boolean;
    isPinned: boolean;  // 置顶状态
    isMuted: boolean;   // 免打扰状态
}

const ChatListPage: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('private');
    const [chatList, setChatList] = useState<ChatItem[]>([]);

    // 模拟数据加载
    useEffect(() => {
        const mockData: ChatItem[] = [
            {
                id: '1',
                name: '张三',
                lastMessage: '你好，最近怎么样？',
                time: '10:30',
                unread: 2,
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                isGroup: false,
                isPinned: true,   // 置顶示例
                isMuted: false
            },
            {
                id: '2',
                name: '李四',
                lastMessage: '项目文档我已经发给你了',
                time: '昨天',
                unread: 0,
                avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
                isGroup: false,
                isPinned: false,
                isMuted: true    // 免打扰示例
            },
            {
                id: '3',
                name: '前端开发群',
                lastMessage: '王五: 这个bug已经修复了',
                time: '昨天',
                unread: 5,
                avatar: 'https://randomuser.me/api/portraits/lego/3.jpg',
                isGroup: true,
                isPinned: true,
                isMuted: false
            },
            {
                id: '4',
                name: '产品讨论组',
                lastMessage: '新版本需求讨论',
                time: '周一',
                unread: 0,
                avatar: 'https://randomuser.me/api/portraits/lego/4.jpg',
                isGroup: true,
                isPinned: false,
                isMuted: true
            },
        ];

        setChatList(mockData);
    }, []);

    // 处理置顶状态切换
    const handlePinToggle = (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatList(prev => prev.map(item =>
            item.id === chatId ? { ...item, isPinned: !item.isPinned } : item
        ));
    };

    // 处理免打扰状态切换
    const handleMuteToggle = (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatList(prev => prev.map(item =>
            item.id === chatId ? { ...item, isMuted: !item.isMuted } : item
        ));
    };

    // 处理聊天项点击
    const handleChatItemClick = (chatId: string) => {
        router.push(`/chat/${chatId}`);
    };

    // 排序聊天列表：置顶的排在前面
    const sortedChatList = [...chatList].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    // 过滤聊天列表
    const filteredChatList = sortedChatList.filter(chat => {
        return activeTab === 'all' ||
            (activeTab === 'private' && !chat.isGroup) ||
            (activeTab === 'group' && chat.isGroup);
    });

    // 下拉菜单项
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

    // 标签页配置
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
            {/* 头部标题和操作 */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>聊天</h2>
                <Dropdown menu={{ items }} trigger={['click']}>
                    <Button type="text" icon={<PlusOutlined />} />
                </Dropdown>
            </div>

            {/* 标签页 */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                style={{ padding: '0 16px' }}
            />

            {/* 聊天列表 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <List
                    dataSource={filteredChatList}
                    renderItem={(item) => (
                        <List.Item
                            key={item.id}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                backgroundColor: item.unread > 0 ? '#f9f9f9' : 'transparent',
                                borderLeft: item.isPinned ? '3px solid #1890ff' : 'none'
                            }}
                            onClick={() => handleChatItemClick(item.id)}
                            actions={[
                                <div key="time" style={{ color: '#999', fontSize: 12 }}>{item.time}</div>,
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
                                    <div style={{ position: 'relative' }}>
                                        <Avatar
                                            src={item.avatar}
                                            icon={item.isGroup ? <TeamOutlined /> : <MessageOutlined />}
                                        />
                                        {item.isPinned && (
                                            <PushpinFilled
                                                style={{
                                                    position: 'absolute',
                                                    top: -5,
                                                    right: -5,
                                                    color: '#1890ff',
                                                    fontSize: 12,
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    padding: 2
                                                }}
                                            />
                                        )}
                                    </div>
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{item.name}</span>
                                        <div>
                                            {item.isMuted ? (
                                                <BellOutlined
                                                    style={{ color: '#999', marginRight: 8 }}
                                                    onClick={(e) => handleMuteToggle(item.id, e)}
                                                />
                                            ) : (
                                                <BellFilled
                                                    style={{ color: '#1890ff', marginRight: 8 }}
                                                    onClick={(e) => handleMuteToggle(item.id, e)}
                                                />
                                            )}
                                            {item.unread > 0 && (
                                                <Badge
                                                    count={item.unread}
                                                    style={{
                                                        backgroundColor: item.isMuted ? '#d9d9d9' : '#1890ff'
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
                                            color: item.unread > 0 ? '#000' : '#999'
                                        }}
                                    >
                                        {item.lastMessage}
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