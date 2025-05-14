'use client';

import React, { useEffect, useState } from 'react';
import { Suspense } from 'react';
import {
    Avatar, Typography, Spin, message, Space, Divider
} from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { BACKEND_URL } from "../../../constants/string";

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
                const res = await fetch(`${BACKEND_URL}/api/user/${username}`, {
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

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Avatar src={userInfo.avatar} size={80} />
                <Title level={4}>{userInfo.userName}</Title>
                <Text>昵称: {userInfo.nickName}</Text>
                <Text>邮箱: {userInfo.email}</Text>
                <Text>手机号: {userInfo.phone}</Text>
                <Divider />
            </Space>
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
