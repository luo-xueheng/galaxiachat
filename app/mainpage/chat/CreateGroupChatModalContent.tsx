'use client';
import React, { useEffect, useState } from 'react';
import { Button, Input, Select, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { BACKEND_URL } from '../../constants/string';

type Friend = {
    userName: string;
    avatar: string;
};

interface AddFriendModalContentProps {
    closeModal: () => void;
}

const CreateGroupChatModalContent = ({ closeModal }: { closeModal: () => void }) => {
    const [value, setValue] = useState<string[]>([]);
    const [groupName, setGroupName] = useState<string>('');
    const [friendOptions, setFriendOptions] = useState<{ label: string; value: string }[]>([]);

    const fetchFriends = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${BACKEND_URL}/api/user/friends`, {
                headers: { Authorization: `${token}` },
            });
            const data = await res.json();
            const uncategorizedFriends: Friend[] = data.data.uncategorized;
            const categorizedGroups: { users: Friend[] }[] = data.data.groups;
            const categorizedFriends = categorizedGroups.flatMap(group => group.users);
            const allFriendsMap = new Map<string, Friend>();
            [...uncategorizedFriends, ...categorizedFriends].forEach(friend => {
                allFriendsMap.set(friend.userName, friend);
            });

            const options = Array.from(allFriendsMap.values()).map((friend: Friend) => ({
                value: friend.userName,
                label: friend.userName,
            }));

            setFriendOptions(options);
        } catch (err) {
            message.error('请求好友列表失败');
        }
    };

    const handleCreateConversation = async (friendUserName: string[], groupname: string) => {
        const currentUser = localStorage.getItem('userName');
        const currentUserToken = localStorage.getItem('token');

        if (!currentUser || !currentUserToken) {
            message.error('请先登录');
            return;
        }
        const ws = new WebSocket(
            `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/chat/new/?token=${currentUserToken}`
        );

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    action: 'create_conversation',
                    user_username: currentUser,
                    is_group: true,
                    member_usernames: friendUserName,
                    name: groupname,
                })
            );
        };

        ws.onmessage = event => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            if (data.action === 'conversation_created' && data.success) {
                console.log('群聊创建成功', data);
                const conversationId = data.conversation.id;

                location.href = `/mainpage/chat/${conversationId}?${new URLSearchParams({
                    chatId: conversationId.toString(),
                    isGroupChat: 'true',
                    groupName: groupname,
                }).toString()}`;

                ws.close();
                closeModal();
            } else {
                message.error('创建会话失败');
                ws.close();
            }
        };

        ws.onerror = () => {
            message.error('WebSocket 连接失败');
        };
    };

    const onClickCreateGroup = () => {
        if (value.length < 2) {
            message.warning('请至少选择两个好友创建群聊');
            return;
        }
        if (!groupName.trim()) {
            message.warning('请填写群聊名称');
            return;
        }
        handleCreateConversation(value, groupName);
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Select
                mode="multiple"
                value={value}
                style={{ width: '100%' }}
                onChange={setValue}
                placeholder="请选择好友"
                options={friendOptions}
            />
            <Input
                placeholder="请输入群聊名称"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
            />
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onClickCreateGroup}
                disabled={value.length < 2 || !groupName.trim()}
            >
                创建群聊
            </Button>
        </div>
    );

};

export default CreateGroupChatModalContent;
