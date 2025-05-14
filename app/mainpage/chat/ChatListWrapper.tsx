'use client'

import { useState, useEffect } from 'react';
import { 
    List, Avatar, Tabs, Badge, Button, 
    Dropdown, MenuProps, message, Space, Typography,
    Modal } from 'antd';
import {
    TeamOutlined,
    PlusOutlined,
    EllipsisOutlined,
    BellOutlined,
    BellFilled,
    UserOutlined,
    PushpinFilled,
    PushpinOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';
import CreateGroupChatModalContent from './CreateGroupChatModalContent';

const { Title } = Typography;

interface Conversation {
    conversation_id: number;
    conversation_name: string;
    is_group: boolean;
    unread_count: number;
    is_muted: boolean;
    is_pinned: boolean;
    updated_at: string;
    last_message?: string;
    avatar?: string;
}

export default function ChatListPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState('');
    const [token, setToken] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [chatList, setChatList] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    // 安全获取 localStorage
    useEffect(() => {
        setCurrentUser(localStorage.getItem('userName') || '');
        setToken(localStorage.getItem('token') || '');
    }, []);

    // 获取用户昵称
    const [nickname, setNickname] = useState(null);
    useEffect(() => {
        const fetchNickname = async () => {
            const userName = localStorage.getItem("userName");
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`api/user_profile/?userName=${userName}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // 一定要加上 Bearer 前缀
                    },
                });

                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }

                const data = await response.json();

                if (data.code === 0) {
                    setNickname(data.nickname); // 可能为 null
                } else {
                    console.error('后端返回错误信息：', data.info);
                }

            } catch (error) {
                console.error('获取昵称失败：', error);
            }
        };

        fetchNickname();
    }, []); // 空依赖数组，组件挂载时执行一次

    // 获取用户头像
    const fetchUserAvatar = async (userName: string): Promise<string | undefined> => {
        const token = localStorage.getItem("token"); // 获取当前用户的token
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

            const data = await response.json();
            return data.avatar;
        } catch (error) {
            console.error('获取用户头像出错:', error);
            return undefined;
        }
    };

    // 处理私聊会话名称，提取对方用户名
    const getPrivateChatPartner = (conversationName: string): string | null => {
        const currentUser = localStorage.getItem("userName"); // 获取当前用户的用户名
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

        setChatList(updatedConversations); // 设置排序后的会话列表
    };

    // 通用排序函数：置顶优先 + 按更新时间倒序
    const sortConversations = (list: Conversation[]) => {
        return list.slice().sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) {
                return b.is_pinned ? 1 : -1; // 置顶优先
            }
            return Date.parse(b.updated_at) - Date.parse(a.updated_at); // 使用 Date.parse 显式解析
        });
    };

    // 获取会话列表
    const fetchConversations = async () => {
        if (!token) {
            message.error('请先登录');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/conversation_unread_counts/', {
                method: 'GET',
                headers: { Authorization: token },
            });

            const data = await response.json();
            console.warn('获取会话列表数据：', data);

            if (data.code === 0) {
                const sortedConversations = sortConversations(data.conversations); // 按更新时间排序
                console.log('排序后的会话列表：', sortedConversations);
                await fetchAndSetAvatars(sortedConversations); // 获取并设置头像
            } else {
                alert(data.info || '获取聊天列表失败');
            }
        } catch (error) {
            alert('获取列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchConversations();
    }, [token, currentUser]);

    // 处理免打扰状态切换
    const handleMuteToggle = async (conversationId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const userName = currentUser;
            const currentConversation = chatList.find(c => c.conversation_id === conversationId);

            if (!userName || !currentConversation) {
                message.error('用户信息获取失败');
                return;
            }

            // 转换布尔值为首字母大写的字符串
            const muteStatus = !currentConversation.is_muted;
            const muteStatusString = muteStatus ? "True" : "False"; // 关键修改点

            const response = await fetch('/api/set_mute_conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify({
                    userName: userName,
                    conversation_id: conversationId.toString(),
                    mute_notifications: muteStatusString // 使用转换后的值
                }),
            });

            // 调试输出响应
            if (process.env.NODE_ENV === 'development') {
                const responseClone = response.clone(); // 克隆response以便多次读取
                console.log('响应状态:', response.status);
                console.log('响应内容:', await responseClone.json());
            }

            if (response.ok) {
                setChatList(prev => prev.map(conv =>
                    conv.conversation_id === conversationId
                        ? { ...conv, is_muted: muteStatus } // 使用原始布尔值更新状态
                        : conv
                ));
                alert(`已${currentConversation.is_muted ? '取消' : '设置'}【${currentConversation.conversation_name}】的免打扰`);
            } else {
                const errorData = await response.json();
                message.error(errorData.info || '操作失败');
            }
        } catch (error) {
            console.error('操作失败:', error);
            message.error('网络请求异常');
        }
    };

    // 处理置顶状态切换
    const handlePinToggle = async (conversationId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const userName = currentUser; // 从组件state获取
            const currentConversation = chatList.find(c => c.conversation_id === conversationId);

            if (!userName || !currentConversation) {
                message.error('用户信息获取失败');
                return;
            }

            // 构建请求body（注意首字母大写的布尔值）
            const pinStatus = !currentConversation.is_pinned;
            const requestBody = {
                userName: userName,
                conversation_id: conversationId.toString(),
                is_pinned: pinStatus ? "True" : "False" // 注意首字母大写
            };

            // 调试用（开发环境打印）
            if (process.env.NODE_ENV === 'development') {
                console.log('置顶请求参数:', requestBody);
            }

            const response = await fetch('/api/set_pin_conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                setChatList(prev => {
                    const updated = prev.map(conv =>
                        conv.conversation_id === conversationId
                            ? { ...conv, is_pinned: pinStatus }
                            : conv
                    );
                    return sortConversations(updated);
                });

                message.success(
                    `已${currentConversation.is_pinned ? '取消' : '设置'}【${currentConversation.conversation_name}】置顶`
                );
            } else {
                const errorData = await response.json();
                message.error(errorData.info || '置顶操作失败');
            }
        } catch (error) {
            console.error('置顶操作异常:', error);
            message.error('网络请求失败');
        }
    };

    const handleChatItemClick = async (conversationId: number) => {
        try {
            const response = await fetch(`api/get_conversation_detail/?conversation_id=${conversationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
            });

            console.log('获取会话详情请求：', response);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('获取会话详情成功：', data);
            const conversationName = data.conversation_name;
            console.log("会话名称：", conversationName);
            const isGroupChat = data.is_group;
            console.log("是否为群聊：", isGroupChat);

            if (!isGroupChat) {
                const friendUserName = getPrivateChatPartner(conversationName);
                console.log("🎯触发私聊点击：", friendUserName);
                router.push(
                    `/mainpage/chat/${conversationId}?${new URLSearchParams({
                        chatId: conversationId.toString(),
                        isGroupChat: isGroupChat.toString(),
                        friendUserName: friendUserName,
                    }).toString()}`
                ); // 将 friendUserName 作为查询参数传递
            } else {
                console.log("群聊名称：", conversationName);
                console.log("🎯触发群聊点击：", conversationName);
                router.push(
                    `/mainpage/chat/${conversationId}?${new URLSearchParams({
                        chatId: conversationId.toString(),
                        isGroupChat: isGroupChat.toString(),
                        groupName: conversationName,
                    }).toString()}`
                ); // 将 groupName 作为查询参数传递
            }

        } catch (error) {
            console.error('获取会话详情失败：', error);
            return null;
        }

    };

    const filteredChatList = chatList.filter(chat => {
        return activeTab === 'all' ||
            (activeTab === 'private' && !chat.is_group) ||
            (activeTab === 'group' && chat.is_group);
    });

    const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: '发起群聊',
            onClick: () => {
                console.log("🎯发起群聊");
                setCreateGroupModalVisible(true);
            }
        },
        {
            key: '2',
            label: '添加好友',
            onClick: () => {
                console.log("🎯触发添加好友");
                // router.push('/mainpage/friends'); // 跳转到添加好友页面
            }
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
        <div 
            className="chat-list-container" 
            style={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column'
            }}
        >
            {/* 头部保持不变 */}
            <div 
                style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid #d9d0ff', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                }}
            >
                <Title level={4}>欢迎，{nickname !== null ? nickname : '未设置昵称'} 👋</Title>
                <Dropdown menu={{ items }} trigger={['click']}>
                    <Button type="text" icon={<PlusOutlined />} />
                </Dropdown>
                {/* 发起群聊的 Modal */}
                <Modal
                    title="发起群聊"
                    open={createGroupModalVisible}
                    onCancel={() => setCreateGroupModalVisible(false)}
                    footer={null}
                    destroyOnClose
                >
                    <CreateGroupChatModalContent closeModal={() => setCreateGroupModalVisible(false)} />
                </Modal>
            </div>

            <Tabs
                activeKey={activeTab}
                centered
                onChange={setActiveTab}
                items={tabItems}
                style={{ padding: '0 16px', color: '#ffffff' }}
                tabBarStyle={{ borderBottom: '1px solid #d9d0ff' }}
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
                                backgroundColor: item.unread_count > 0 ? '5e3dbb' : 'transparent',
                                borderLeft: item.is_pinned ? '3px solid #5e3dbb' : 'none', // 置顶标识
                                background: item.is_pinned ? '#f4f0ff' : 'inherit' // 置顶背景色
                            }}
                            onClick={() => handleChatItemClick(item.conversation_id)}
                            actions={[
                                <div key="time" style={{ color: '#999', fontSize: 12 }}>
                                    {formatTime(item.updated_at)}
                                </div>,
                                <Space key="actions" size={8}>
                                    <Button
                                        type="text"
                                        icon={item.is_pinned ? <PushpinFilled style={{ color: '#5e3dbb' }} /> : <PushpinOutlined />}
                                        onClick={(e) => handlePinToggle(item.conversation_id, e)}
                                    />
                                    <Button
                                        type="text"
                                        icon={item.is_muted ? <BellOutlined style={{ color: '#999' }} /> : <BellFilled style={{ color: '#5e3dbb' }} />}
                                        onClick={(e) => handleMuteToggle(item.conversation_id, e)}
                                    />
                                    <Button
                                        type="text"
                                        icon={<EllipsisOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Space>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Badge
                                        dot={item.is_pinned}
                                        offset={[-10, 30]}
                                        color="#5e3dbb"
                                    >
                                        <Avatar
                                            src={item.avatar}
                                            icon={item.is_group ? <TeamOutlined /> : <UserOutlined />}
                                            style={{
                                                backgroundColor: item.is_group ? '#5e3dbb' : '#7265e6',
                                            }}
                                        />
                                    </Badge>
                                }
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: item.is_pinned ? 500 : 'normal' }}>
                                            {item.is_group
                                                ? item.conversation_name
                                                : getPrivateChatPartner(item.conversation_name) || item.conversation_name}
                                            {item.is_pinned && (
                                                <span style={{ marginLeft: 8, color: '#5e3dbb', fontSize: 12 }}>[置顶]</span>
                                            )}
                                        </span>
                                        {item.unread_count > 0 && (
                                            <Badge
                                                count={item.unread_count}
                                                style={{
                                                    backgroundColor: item.is_muted ? '#d9d9d9' : '#1890ff'
                                                }}
                                            />
                                        )}
                                    </div>
                                }
                                description={
                                    <div
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            color: item.unread_count > 0 ? '#000' : '#999',
                                            fontWeight: item.is_pinned ? 500 : 'normal'
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


// 辅助函数
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