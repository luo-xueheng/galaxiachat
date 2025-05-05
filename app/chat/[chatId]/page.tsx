'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space, Popover, Image } from 'antd';
import { SmileOutlined, PictureOutlined } from '@ant-design/icons';
import { SendOutlined, CheckCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { BACKEND_URL } from "../../constants/string";
import { Drawer } from 'antd';
import { useRouter } from 'next/navigation'; // 使用新的 useRouter

const { Header, Content, Footer } = Layout;
const { Text } = Typography;


const emojiList = ['😊', '😂', '🥰', '👍', '🎉', '😢', '😡', '❤️', '👏']; // 表情列表

type MsgType = 'text' | 'emoji' | 'image'; // 消息类型
interface ChatMessage {
    id: number;                 // msg_id
    sender: 'me' | 'friend';    // 判断 sender_name 是否是自己
    msgType: MsgType;           // 消息类型
    content: string;            // 消息内容
    timestamp: string;          // 格式化后的 created_at
    isRead?: boolean;           // 是否已读（可选）
    readBy?: string[];          // 已读成员用户名数组（可选）
    replyToId?: number;         // 回复的消息ID
    repliedByIds?: number[];    // 被哪些消息回复
}

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const currentUser = localStorage.getItem("userName"); // 获取当前用户的用户名
    const currentUserToken = localStorage.getItem("token"); // 获取当前用户的token
    // const friendUserName = localStorage.getItem("currentChatFriendUserName"); // 获取当前用户的用户名
    // const groupname = localStorage.getItem("currentChatGroupName"); // 获取当前群聊的名称
    // const groupId = localStorage.getItem("currentChatGroupId"); // 获取当前群聊的ID
    // const isGroupChat = localStorage.getItem("isGroupChat"); // 判断是否是群聊
    const friendUserName = searchParams.get("currentChatFriendUserName"); // 获取当前用户的用户名
    const groupname = searchParams.get("currentChatGroupName"); // 获取当前群聊的名称
    // const groupId = searchParams.get("currentChatGroupId"); // 获取当前群聊的ID
    const isGroupChat = searchParams.get("isGroupChat"); // 判断是否是群聊
    const { chatId } = useParams(); // 获取路由中的chatId
    const groupId = chatId;

    console.log("当前用户: ", currentUser);
    console.log("当前用户token: ", currentUserToken);
    console.log("好友: ", friendUserName);
    const router = useRouter();

    const [drawerOpen, setDrawerOpen] = useState(false);

    const showDrawer = () => setDrawerOpen(true);
    const closeDrawer = () => setDrawerOpen(false);

    /*
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 997,
            sender: 'friend',
            content: '你好呀～',
            timestamp: '2025-05-03 10:00',
        },
        {
            id: 998,
            sender: 'me',
            content: '嗨！最近怎么样？',
            timestamp: '2025-05-03 10:01',
            isRead: true, // 模拟已读
        },
        {
            id: 999,
            sender: 'me',
            content: '今天有空出来玩嘛？',
            timestamp: '2025-05-03 10:05',
            isRead: false, // 模拟未读
        },
    ]);
    */
    const [messages, setMessages] = useState<ChatMessage[]>([]); // 初始化为空数组

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

    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (!chatId) {
            console.warn('[WebSocket] 缺少 chatId，终止连接');
            console.log("chatId: ", chatId);
            return;
        }

        if (!currentUserToken) {
            console.warn('[WebSocket] 缺少 currentUserToken，终止连接');
            return;
        }

        console.log(`[WebSocket] 尝试连接到 chatId=${chatId} 的聊天 WebSocket`);

        const ws = new WebSocket(`wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/chat/${chatId}/?token=${currentUserToken}`);

        ws.onopen = () => {
            console.log('[WebSocket] 连接已建立');
        };

        ws.onmessage = (event) => {
            console.log('[WebSocket] 收到原始消息：', event.data);

            try {
                const data = JSON.parse(event.data);

                if (data.action === 'new_message') {
                    const msg = data.message;
                    const senderName = msg.sender_name;
                    const isMe = senderName === currentUser; // 当前用户名来自 localStorage

                    const newMessage: ChatMessage = {
                        id: msg.msg_id,
                        sender: isMe ? 'me' : 'friend',
                        msgType: msg.msg_type as MsgType,
                        //content: msg.content,
                        content:
                            msg.msg_type === 'image'
                                ? `https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net${msg.content}`
                                : msg.content,
                        timestamp: new Date(msg.created_at * 1000).toLocaleString(),
                        isRead: msg.is_read,
                        readBy: msg.read_by,
                    };

                    console.log('[WebSocket] 新消息解析成功，添加到聊天记录：', newMessage);
                    setMessages((prev) => [...prev, newMessage]);
                } else {
                    console.log('[WebSocket] 收到非 new_message 的 action：', data.action);
                }
            } catch (err) {
                console.error('[WebSocket] 消息解析失败：', err);
            }
        };

        ws.onclose = () => {
            console.warn('[WebSocket] 连接已关闭');
        };

        ws.onerror = (err) => {
            console.error('[WebSocket] 发生错误：', err);
        };

        setSocket(ws);

        return () => {
            console.log('[WebSocket] 正在关闭连接...');
            ws.close();
        };
    }, [chatId, currentUserToken]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        console.log('[handleSend] 触发发送');

        if (!input.trim()) {
            console.log('[handleSend] 输入为空，发送终止');
            return;
        }

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error('[handleSend] WebSocket 未连接，当前状态为：', socket?.readyState);
            return;
        }

        const messagePayload = {
            action: 'send_message',
            msg_type: 'text',
            content: input,
        };

        console.log('[handleSend] 发送内容：', messagePayload);
        socket.send(JSON.stringify(messagePayload));

        setInput('');
    };

    const handleReply = () => {

    };

    const handleSendEmoji = (emoji: string) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        socket.send(JSON.stringify({
            action: 'send_message',
            msg_type: 'emoji',
            content: emoji,
        }));
    };

    const emojiContent = (
        <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 200 }}>
            {emojiList.map((emoji) => (
                <span
                    key={emoji}
                    style={{ fontSize: 24, padding: 5, cursor: 'pointer' }}
                    onClick={() => handleSendEmoji(emoji)}
                >
                    {emoji}
                </span>
            ))}
        </div>
    );

    const handleSendImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg';

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                alert('图片不能超过10MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;

                if (socket?.readyState !== WebSocket.OPEN) {
                    alert('WebSocket 未连接');
                    return;
                }

                socket.send(
                    JSON.stringify({
                        action: 'send_message',
                        msg_type: 'image',
                        content: base64,
                    })
                );

                console.log('[图片已发送]', base64.slice(0, 100) + '...');
            };

            reader.readAsDataURL(file);
        };

        input.click();
    };

    const handleleavegroup = () => {
        const token = localStorage.getItem("token");
        console.log("当前groupid", groupId)
        fetch(`${BACKEND_URL}/api/leave-groups`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                group_id: groupId,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (Number(res.code) === 0) {
                    alert("退出群聊成功");
                    // localStorage.removeItem("currentGroupId");
                    // localStorage.removeItem("currentChatGroupName");
                    // localStorage.removeItem("isGroupChat");
                    router.push("/mainpage");
                }
                else {
                    console.log("退出群聊失败", res);
                }
            })
    };

    console.log("is group chat: ", isGroupChat);

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong>
                        {isGroupChat === 'true' ? groupname : friendUserName}
                    </Text>

                    {isGroupChat === 'true' && (
                        <Button type="link" onClick={showDrawer}>
                            群聊管理
                        </Button>
                    )}
                </div>
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
                            {/* 好友头像 */}
                            {item.sender === 'friend' && <Avatar src={friendAvatar} />}
                            <Popover
                                content={
                                    <Space direction="vertical">
                                        <Button type="link" size="small" onClick={() => handleReply()}>
                                            回复
                                        </Button>
                                        {/* 其他操作可以继续加 */}
                                    </Space>
                                }
                                trigger="contextMenu"
                            >
                                <Space
                                    align="end"
                                    style={{
                                        maxWidth: '70%',
                                        background: item.sender === 'me' ? '#cfe9ff' : '#ffffff',
                                        padding: '8px 12px',
                                        borderRadius: '16px',
                                        flexDirection: 'column',
                                        alignItems: item.sender === 'me' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {/* 消息内容 */}
                                    <div>
                                        {item.msgType === 'emoji' ? (
                                            <span style={{ fontSize: 36, marginLeft: 4 }}>{item.content}</span>
                                        ) : item.msgType === 'image' ? (
                                            <Image
                                                src={item.content}
                                                alt="图片消息"
                                                style={{ maxWidth: 200, borderRadius: 8 }}
                                                preview={{
                                                    mask: '点击预览',
                                                }}
                                                placeholder
                                            />
                                        ) : (
                                            <span>{item.content}</span>
                                        )}
                                    </div>

                                    {/* 消息时间和已读状态 */}
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {item.sender === 'me' && (
                                            item.isRead ? (
                                                <CheckCircleTwoTone twoToneColor="#52c41a" title="对方已读" />
                                            ) : (
                                                <ClockCircleOutlined style={{ color: '#aaa' }} title="等待对方阅读" />
                                            )
                                        )}

                                        <Text type="secondary" style={{ fontSize: '0.75em' }}>
                                            {item.timestamp}
                                        </Text>

                                    </div>

                                </Space>
                            </Popover>

                            {/* 自己头像 */}
                            {item.sender === 'me' && <Avatar src={myAvatar} />}


                        </List.Item>
                    )}
                />
                <div ref={messageEndRef} />
            </Content>

            <Footer style={{ padding: '8px 16px' }}>
                <Space.Compact style={{ width: '100%' }}>
                    {/* 输入框 */}
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

                    {/* 表情按钮 */}
                    <Popover content={emojiContent} trigger="click">
                        <Button icon={<SmileOutlined />} />
                    </Popover>

                    {/* 图片按钮 */}
                    <Button
                        icon={<PictureOutlined />}
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/png, image/jpeg';
                            input.onchange = async () => {
                                const file = input.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) {
                                    alert('图片不能超过10MB');
                                    return;
                                }

                                const reader = new FileReader();
                                reader.onload = () => {
                                    const base64 = reader.result as string;
                                    if (socket?.readyState === WebSocket.OPEN) {
                                        socket.send(
                                            JSON.stringify({
                                                action: 'send_message',
                                                msg_type: 'image',
                                                content: base64,
                                            })
                                        );
                                    }
                                };
                                reader.readAsDataURL(file);
                            };
                            input.click();
                        }}
                    />

                    {/* 发送按钮 */}
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
                        发送
                    </Button>
                </Space.Compact>
            </Footer>
            <Drawer
                title="群聊管理"
                placement="right"
                closable
                onClose={closeDrawer}
                open={drawerOpen}
                width={320}
            >
                {/* 这里可以添加你的群聊管理内容，比如成员列表、添加成员等 */}
                <p>群聊 ID: {groupId}</p>
                <p>群聊名称: {groupname}</p>
                <p>群成员管理功能开发中...</p>
                <Button type="primary" onClick={handleleavegroup}>
                    退出群聊
                </Button>
            </Drawer>
        </Layout>
    );
}