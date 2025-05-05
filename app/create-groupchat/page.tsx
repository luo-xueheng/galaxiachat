"use client";
import React, { useEffect, useState } from 'react';
import { Button, Space } from 'antd';
import { Select, message } from 'antd';
import { BACKEND_URL } from "../constants/string";
import { useRouter } from "next/navigation";
import { PlusOutlined } from '@ant-design/icons';

type Friend = {
    userName: string;
    avatar: string;
};

const Page = () => {
    const [value, setValue] = useState<string[]>([]);
    const [friendOptions, setFriendOptions] = useState<{ label: string; value: string }[]>([]);

    const router = useRouter();

    const fetchFriends = async () => {
        // const options;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${BACKEND_URL}/api/user/friends`, {
                headers: { Authorization: `${token}` },
            });
            const data = await res.json();
            console.log("获取好友列表", data);
            const uncategorizedFriends: Friend[] = data.data.uncategorized;
            const categorizedGroups: { users: Friend[] }[] = data.data.groups;
            // 提取 categorizedFriends
            const categorizedFriends = categorizedGroups.flatMap(group => group.users);
            // 合并去重（以 userName 去重）
            const allFriendsMap = new Map<string, Friend>();
            [...uncategorizedFriends, ...categorizedFriends].forEach(friend => {
                allFriendsMap.set(friend.userName, friend);
            });

            // 转换成 options 格式
            const options = Array.from(allFriendsMap.values()).map((friend: Friend) => ({
                value: friend.userName,
                label: friend.userName,
            }));

            console.log("合并后的好友列表", options);
            setFriendOptions(options);
        } catch (err) {
            message.error("请求好友列表失败");
        }
    };
    const handleCreateConversation = async (friendUserName: string[]) => {
        const currentUser = localStorage.getItem("userName");
        const currentUserToken = localStorage.getItem("token");

        if (!currentUser || !currentUserToken) {
            message.error("请先登录");
            return;
        }
        console.log("当前用户", currentUser);
        console.log("当前用户的 token", currentUserToken);
        console.log("要创建群聊的好友", friendUserName);
        const ws = new WebSocket(`wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/chat/new/?token=${currentUserToken}`);

        ws.onopen = () => {
            console.log("✅ WebSocket 连接已建立");
            ws.send(JSON.stringify({
                action: "create_conversation",
                user_username: currentUser,
                is_group: true,
                member_usernames: friendUserName,
                name: ""
            }));
        };

        ws.onmessage = (event) => {
            console.log("📩 收到消息:", event.data);
            const data = JSON.parse(event.data);

            if (data.action === "conversation_created" && data.success) {
                console.log("创建群聊成功", data);
                const conversationId = data.conversation.id;

                localStorage.setItem("currentChatGroupId", conversationId);
                localStorage.setItem("isGroupChat", "true");
                router.push(`/chat/${conversationId}`);
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
    const onClickCreateGroup = () => {
        if (value.length < 2) {
            message.warning("请至少选择两个好友创建群聊");
            return;
        }
        handleCreateConversation(value);
    };

    useEffect(() => {
        fetchFriends();
    }, []);
    return (
        <Select
            mode="multiple"
            value={value}
            style={{ width: '100%' }}
            onChange={setValue}
            placeholder="请选择好友"
            options={friendOptions}
            dropdownRender={menu => (
                <>
                    {menu}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={onClickCreateGroup}
                            disabled={value.length < 2}
                        >
                            创建群聊
                        </Button>
                    </div>
                </>
            )}
        />
    );
};

export default Page;
