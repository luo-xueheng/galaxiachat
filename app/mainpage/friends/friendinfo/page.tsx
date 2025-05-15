'use client';

import React, { useEffect, useState } from 'react';
import { Suspense } from 'react';
import {
    Avatar, Typography, Spin, message, Space, Divider, Button, Modal
} from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { BACKEND_URL } from "../../../constants/string";
import {
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    MessageOutlined,
    DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface UserProfile {
    avatar: string;
    userName: string;
    nickName: string | null;
    email: string;
    phone: string;
}

const FriendInfo = () => {
    const searchParams = useSearchParams();
    const username = searchParams.get('infoUserName');
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async (username: string | null) => {
            if (!username) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`api/user/${username}`, {
                    headers: {
                        'Authorization': token ?? '',
                    },
                });

                if (!res.ok) throw new Error('请求失败');
                const data = await res.json();

                const userInfo: UserProfile = {
                    avatar: data.avatar,
                    userName: data.userName,
                    nickName: data.nickName,
                    email: data.email,
                    phone: data.phone,
                };
                setUserInfo(userInfo);
            } catch (err) {
                console.error("获取用户信息失败：", err);
                message.error("获取用户信息失败");
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo(username);
    }, [username]);

    // ✅ 处理加载中或 userInfo 为空的情况
    if (loading || !userInfo) {
        return (
            <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin tip="加载中..." size="large" />
            </div>
        );
    }

    // ✅ 处理创建会话的函数
    const handleCreateConversation = async (friendUserName: string) => {
        console.log("创建会话", friendUserName);
        const currentUser = localStorage.getItem("userName");
        const currentUserToken = localStorage.getItem("token");

        if (!currentUser || !currentUserToken) {
            message.error("请先登录");
            return;
        }

        const ws = new WebSocket(`wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/chat/new/?token=${currentUserToken}`);

        ws.onopen = () => {
            ws.send(JSON.stringify({
                action: "create_conversation",
                user_username: currentUser,
                is_group: false,
                member_usernames: [friendUserName],
                name: ""
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === "conversation_created" && data.success) {
                const conversationId = data.conversation.id;
                router.push(
                    `/mainpage/chat/${conversationId}?${new URLSearchParams({
                        chatId: conversationId.toString(),
                        isGroupChat: "false",
                        friendUserName: friendUserName,
                    }).toString()}`
                ); // 将 friendUserName 作为查询参数传递
                ws.close();
            } else {
                message.error("创建会话失败");
                ws.close();
            }
        };

        ws.onerror = () => {
            message.error("WebSocket 连接失败");
        };
    };
    

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f5f5f5',
            }}
        >
            <div
                style={{
                    padding: 24,
                    maxWidth: 480,
                    width: '100%',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <Avatar
                        src={userInfo.avatar}
                        size={100}
                        style={{
                            border: '2px solid #5e3dbb',
                            marginTop: 36,
                            marginBottom: 16,
                        }}
                    />
                    <Title level={4} style={{ marginBottom: 4 }}>
                        {userInfo.nickName || '未设置昵称'}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        {"这个人很懒，什么都没有留下~"}
                    </Text>
                </div>

                <Divider />

                <div style={{ textAlign: 'center' }}>
                    <Space 
                        direction="vertical" 
                        size="middle" 
                        style={{ width: '100%' }}
                    >
                        <Text>
                            <UserOutlined style={{ marginRight: 8 }} />
                            <b>用户名：</b>{userInfo.userName}
                        </Text>
                        <Text>
                            <MailOutlined style={{ marginRight: 8 }} />
                            <b>邮箱：</b>{userInfo.email || '未绑定'}
                        </Text>
                        <Text>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            <b>手机号：</b>{userInfo.phone || '未绑定'}
                        </Text>
                    </Space>
                </div>

                <Divider />

                <div style={{ textAlign: 'center' }}>
                    <Space size={100}>
                        <div
                            onClick={() => handleCreateConversation(userInfo.userName)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                color: '#5e3dbb',
                            }}
                        >
                            <MessageOutlined style={{ fontSize: 24, marginBottom: 4 }} />
                            <span style={{ fontSize: 12 }}>发消息</span>
                        </div>

                    </Space>
                </div>


            </div>
        </div>
    );

}
export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FriendInfo />
        </Suspense>
    );
}
