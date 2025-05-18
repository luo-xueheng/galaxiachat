'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space, Popover, Image, Modal, Dropdown, Menu, Tooltip } from 'antd';
import { SmileOutlined, PictureOutlined, EllipsisOutlined, TeamOutlined } from '@ant-design/icons';
import { SendOutlined, CheckCircleTwoTone, ClockCircleOutlined, MessageOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const emojiList = ['😊', '😂', '🥰', '😢', '😎', '👍', '🎉', '😡', '❤️', '👏']; // 表情列表

type MsgType = 'text' | 'emoji' | 'image'; // 消息类型
interface ChatMessage {
    id: number;                 // msg_id
    sender: string;             // 发送者用户名
    msgType: MsgType;           // 消息类型
    content: string;            // 消息内容
    timestamp: string;          // 格式化后的 created_at
    isRead?: boolean;           // 是否已读（可选）
    readBy?: string[];          // 已读成员用户名数组（可选）
    replyToId?: number;         // 回复的消息ID
    replyCount: number;         // 被哪些消息回复
}

export default function ChatPage() {

    const currentUser = localStorage.getItem("userName"); // 获取当前用户的用户名
    const currentUserToken = localStorage.getItem("token"); // 获取当前用户的token
    console.log("当前用户: ", currentUser);
    console.log("当前用户token: ", currentUserToken);

    const searchParams = useSearchParams();
    const conversationId = Number(searchParams.get('chatId')); // 获取当前聊天的会话ID
    console.log("当前会话ID: ", conversationId);
    const isGroupChat = searchParams.get('isGroupChat') === 'true'; // 判断是否是群聊
    console.log("当前是否是群聊: ", isGroupChat);

    if (!isGroupChat) {
        const friendUserName = searchParams.get('friendUserName'); // 获取当前聊天的好友用户名
        console.log("当前聊天的好友用户名: ", friendUserName);
    } else {
        const groupName = searchParams.get('groupName'); // 获取当前聊天的群组名
        console.log("当前聊天的群组名: ", groupName);
    }
    // 此后无法直接获取到 friendUserName 和 groupName的值，需重新从params中获取
    const friendUserName = searchParams.get('friendUserName'); // 获取当前聊天的好友用户名
    const groupName = searchParams.get('groupName');           // 获取当前聊天的群组名

    // 🎯 获取头像
    const [myAvatar, setMyAvatar] = useState<string | undefined>(undefined);         // 我的头像
    const [friendAvatar, setFriendAvatar] = useState<string | undefined>(undefined); // 好友头像
    const [groupAvatars, setGroupAvatars] = useState<Record<string, string>>({});    // 群聊头像列表
    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                const fetchUserAvatar = async (userName: string): Promise<string | undefined> => {
                    const response = await fetch('/api/user/' + userName, {
                        method: 'GET',
                    });

                    if (!response.ok) throw new Error('获取头像失败');

                    const data = await response.json();
                    //console.log("用户头像获取成功", userName, data.avatar);
                    console.log("用户头像获取成功", data);
                    return data.avatar;
                };

                if (!isGroupChat) {
                    console.log("私聊模式");
                    // 私聊模式
                    const [myAvatar, friendAvatar] = await Promise.all([
                        fetchUserAvatar(currentUser!),
                        fetchUserAvatar(friendUserName as string),
                    ]);
                    
                    setMyAvatar(myAvatar);
                    setFriendAvatar(friendAvatar);

                    console.log("我的头像: ", myAvatar);
                    console.log("朋友头像: ", friendAvatar);
                } else {
                    // 群聊模式
                    const response = await fetch(`/api/get_conversation_detail/?conversation_id=${conversationId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': currentUserToken!,
                        }
                    });

                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                    const data = await response.json();
                    const members = data.members;

                    const avatarMap: Record<string, string> = {};
                    members.forEach((member: any) => {
                        avatarMap[member.username] = member.avatar;
                    });
                    console.log("群聊头像获取成功", avatarMap);
                    setGroupAvatars(avatarMap);
                }
            } catch (err) {
                console.error('加载头像失败: ', err);
                alert('无法加载头像，请检查网络或登录状态');
            }
        };

        fetchAvatars();
    }, [searchParams, currentUser]);

    // 🎯 拉取历史消息
    const [messages, setMessages] = useState<ChatMessage[]>([]); // 初始化为空数组
    useEffect(() => {
        if (!conversationId || !currentUser || !currentUserToken) return;

        const fetchHistoryMessages = async () => {
            try {
                const url = new URL('https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/get_conversation_messages/');
                url.searchParams.set('userName', currentUser);
                url.searchParams.set('conversation_id', String(conversationId));

                const res = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        Authorization: `${currentUserToken}`,
                    },
                });

                const data = await res.json();

                if (data.code !== 0) {
                    console.error('获取历史消息失败:', data.info);
                    return;
                }
                console.log('获取历史消息成功:', data); // 🟢 打印获取的历史消息

                const historyMessages: ChatMessage[] = data.messages.map((msg: any) => {
                    return {
                        id: msg.msg_id,
                        sender: msg.sender_name,
                        msgType: msg.msg_type as MsgType,
                        content:
                            msg.msg_type === 'image'
                                ? `${msg.content}`
                                : msg.content,
                        timestamp: new Date(msg.created_at * 1000).toLocaleString(),
                        replyToId: msg.reply_to?.msg_id ?? null,
                        isRead: msg.is_read,
                        readBy: msg.read_by,
                        replyCount: msg.reply_count ?? 0,
                    };
                });

                // setMessages(historyMessages);
                // 去重逻辑：合并已有消息和新拉取的消息，然后按 msg_id 去重
                setMessages(prevMessages => {
                    const allMessages = [...prevMessages, ...historyMessages];
                    const uniqueMap = new Map<string, ChatMessage>();
                    for (const msg of allMessages) {
                        uniqueMap.set(msg.id.toString(), msg); // 后来的会覆盖重复的
                    }
                    return Array.from(uniqueMap.values()).sort((a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                });

            } catch (error) {
                console.error('请求历史消息时出错:', error);
            }
        };

        fetchHistoryMessages();
    }, [conversationId, currentUser, currentUserToken]);

    // 🎯 建立 WebSocket 连接，监听新消息
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const reconnectDelay = 3000; // 1秒后尝试重连
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let ws: WebSocket;

        const connectWebSocket = () => {
            if (!conversationId || !currentUserToken) {
                console.warn('[WebSocket] 缺少必要参数，终止连接');
                return;
            }

            console.log('[WebSocket] 正在尝试连接...');
            ws = new WebSocket(
                `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/chat/${conversationId}/?token=${currentUserToken}`
            );

            ws.onopen = () => {
                console.log('[WebSocket] 连接已建立');
            };

            ws.onmessage = (event) => {
                console.log('[WebSocket] 收到消息：', event.data);

                try {
                    const data = JSON.parse(event.data);

                    if (data.action === 'new_message') {
                        const msg = data.message;
                        const newMessage: ChatMessage = {
                            id: msg.msg_id,
                            sender: msg.sender_name,
                            msgType: msg.msg_type as MsgType,
                            content:
                                msg.msg_type === 'image'
                                    ? `https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net${msg.content}`
                                    : msg.content,
                            timestamp: new Date(msg.created_at * 1000).toLocaleString(),
                            replyToId: msg.reply_to?.msg_id ?? null,
                            isRead: msg.is_read,
                            readBy: msg.read_by,
                            replyCount: msg.reply_count ?? 0,
                        }; 

                        // 新消息插到前面
                        // setMessages(prev => [newMessage, ...prev]);
                        // 去重并添加新消息
                        setMessages(prev => {
                            const exists = prev.some(m => m.id === newMessage.id);
                            if (exists) {
                                console.log('[WebSocket] 收到重复消息，忽略：', newMessage.id);
                                return prev; // 已存在，跳过添加
                            }
                            return [newMessage, ...prev];
                        });


                        // 立即发送“整会话标为已读”指令
                        ws.send(JSON.stringify({
                            action: 'mark_as_read',
                            conversation_id: String(conversationId),
                        }));
                        console.log('[WebSocket] 已发送 mark_as_read');

                        // 发送 acknowledge 确认消息
                        if (msg.msg_id && msg.sender_name) {
                            ws.send(JSON.stringify({
                                action: 'acknowledge',
                                msg_id: msg.msg_id,
                                sender: msg.sender_name,
                            }));
                            console.log('[WebSocket] 已发送 acknowledge');
                        } else {
                            console.warn('[WebSocket] acknowledge 缺少字段，不发送：', msg);
                        }
                    } else if (data.action === 'message_read') {
                        console.log('[WebSocket] 收到 message_read', data);
                        const { msg_ids, reader } = data;

                        if (!msg_ids || !Array.isArray(msg_ids)) return;

                        setMessages(prev =>
                            prev.map(msg => {
                                if (!msg_ids.includes(msg.id)) return msg;

                                if (!isGroupChat) {
                                    // 私聊：只有一个对方用户，reader 不是自己就标记为已读
                                    if (reader !== currentUser) {
                                        return {
                                            ...msg,
                                            isRead: true,
                                            readBy: [reader],
                                        };
                                    } else {
                                        return msg;
                                    }
                                } else {
                                    // 群聊：把 reader 加入 readBy 列表（去重）
                                    const alreadyRead = msg.readBy.includes(reader);
                                    if (reader !== currentUser) {
                                        return {
                                            ...msg,
                                            readBy: alreadyRead ? msg.readBy : [...msg.readBy, reader],
                                        };
                                    } else {
                                        return msg;
                                    }
                                }

                            })
                        );

                        console.log(`[WebSocket] 收到 message_read：${reader} 已读 ${msg_ids.length} 条消息`);
                    } else if (data.action === 'reply_count_updated') {
                        console.log('[WebSocket] 收到 reply_count_updated：', data);

                        const { message_id, new_count } = data;

                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === message_id
                                    ? { ...msg, replyCount: new_count }
                                    : msg
                            )
                        );
                    }

                } catch (err) {
                    console.error('[WebSocket] 消息解析失败：', err);
                }
            };

            ws.onclose = (event) => {
                console.warn('[WebSocket] 连接已关闭', event);
                /*
                if (event.code !== 1000) {
                    console.log(`[WebSocket] 非正常关闭（code=${event.code}），${reconnectDelay / 3000}秒后尝试重连...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, reconnectDelay);
                }
                */
            };

            ws.onerror = (err) => {
                console.error('[WebSocket] 错误发生：', err);
            };

            setSocket(ws);
        };

        connectWebSocket();

        return () => {
            console.log('[WebSocket] 正在清理连接...');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            ws && ws.close();
        };
    }, [conversationId, currentUserToken, currentUser]);


    // ✅ 滚动到底部
    const messageEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 🎯 发送消息(含回复)
    const [input, setInput] = useState('');
    const [replyToId, setReplyToId] = useState<number | null>(null);
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

        const messagePayload: any = {
            action: 'send_message',
            msg_type: 'text',
            content: input,
        };

        if (replyToId !== null) {
            messagePayload.reply_to = replyToId;
        }

        console.log('[handleSend] 发送内容：', messagePayload);
        socket.send(JSON.stringify(messagePayload));
        setInput('');       // 清空输入框
        setReplyToId(null); // 发送完清除回复状态
    };

    // ✅ 显示被回复消息的内容
    const replyingMessage = useMemo(
        () => messages.find((msg) => msg.id === replyToId) || null,
        [replyToId, messages]
    );
    // 🎯 回复消息
    const handleReply = (msgId: number) => {
        setReplyToId(msgId);
        console.log('[handleReply] 正在回复消息 ID:', msgId);
    };

    // 🎯 滚动到指定消息
    const scrollToMessage = (msgId: number) => {
        const element = document.getElementById(`msg-${msgId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.backgroundColor = '#e6f7ff';
            setTimeout(() => {
                element.style.backgroundColor = 'transparent';
            }, 1500);
        }
    };

    // 🎯 发送表情
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
    const handleSendEmoji = (emoji: string) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        socket.send(JSON.stringify({
            action: 'send_message',
            msg_type: 'emoji',
            content: emoji,
        }));
    };

    // 🎯 删除消息
    const handleDelete = async (msgId: number) => {
        if (!currentUserToken || !currentUser) {
            console.error("未获取到用户信息，无法删除消息");
            return;
        }
        try {
            const response = await fetch("https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/delete_message/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: currentUserToken,
                },
                body: JSON.stringify({
                    userName: currentUser,
                    conversation_id: conversationId,
                    msg_ids: [msgId],
                }),
            });

            const result = await response.json();

            if (result.code === 0) {
                console.log("删除成功：", result);
                setMessages((prev) => prev.filter((msg) => msg.id !== msgId));
            } else {
                console.warn("删除失败：", result);
            }

        } catch (error) {
            console.error("删除请求出错：", error);
        }
    };

    // 🎯 查找聊天记录
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
    const [searchSender, setSearchSender] = useState('');
    const [searchStartDate, setSearchStartDate] = useState<string | undefined>();
    const [searchEndDate, setSearchEndDate] = useState<string | undefined>();
    // ✅ 打开聊天记录模态框
    const openModal = () => {
        console.log('openModal');
        setIsModalOpen(true);
        setFilteredMessages(messages); // 初始展示所有
    };
    // 设置筛选条件
    const handleFilter = () => {
        const result = messages.filter((msg) => {
            const matchSender = !searchSender || msg.sender.includes(searchSender);
            const matchTime = isWithinDateRange(msg.timestamp, searchStartDate, searchEndDate);
            return matchSender && matchTime;
        });
        setFilteredMessages(result);
    };
    // 判断消息时间是否在范围内
    const isWithinDateRange = (msgTime: string, start?: string, end?: string) => {
        const time = new Date(msgTime).getTime();
        const startTime = start ? new Date(start).getTime() : -Infinity;
        const endTime = end ? new Date(end).getTime() : Infinity;
        return time >= startTime && time <= endTime;
    };

    // 🎯 跳转到群聊管理
    const router = useRouter();
    const handleChatGroupManagement = () => {
        const query = new URLSearchParams({
            isGroupChat: "true",
            currentChatGroupName: groupName,
            groupId: conversationId.toString(),
        }).toString();

        router.push(`/mainpage/chat/groupmanagement?${query}`);
    };

    console.log("is group chat: ", isGroupChat);

    // 🎯 获取群聊成员人数
    const [totalMembers, setTotalMembers] = useState<number>(0);
    const [groupMembers, setGroupMembers] = useState<Record<string, string>>({});
    const fetchTotalMembers = async (conversationId: number): Promise<number> => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/get_conversation_detail/?conversation_id=${conversationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': currentUserToken!,
                }
            });
            const data = await response.json();
            if (data.code === 0 && Array.isArray(data.members)) {
                console.log("获取成员成功：", data.members);
                return data.members.length;
            } else {
                console.error("获取成员失败：", data.info);
                return 0;
            }
        } catch (error) {
            console.error("获取成员请求失败：", error);
            return 0;
        }
    };
    useEffect(() => {
        if (conversationId) {
            fetchTotalMembers(conversationId).then(setTotalMembers);
        }
    }, [conversationId]);


    return (
        <Layout style={{ height: '100vh' }}>
            {/* 头部: 聊天名称、群聊管理、查找聊天记录 */}
            <Header style={{
                background: '#fff',
                padding: '0 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>

                <Text strong>{isGroupChat ? groupName : friendUserName}</Text>
                <Dropdown
                    overlay={
                        <Menu>
                            {isGroupChat && (
                                <Menu.Item key="group-management" onClick={() => handleChatGroupManagement()}>
                                    <TeamOutlined style={{ marginRight: 8 }} />
                                    群聊管理
                                </Menu.Item>
                            )}
                            <Menu.Item key="search-history" onClick={openModal}>
                                <SearchOutlined style={{ marginRight: 8 }} />
                                查找聊天记录
                            </Menu.Item>
                        </Menu>
                    }
                    trigger={['click']}
                >
                    <Button type="text" icon={<EllipsisOutlined />} />

                </Dropdown>
            </Header>

            {/* 查找聊天记录模态框 */}
            <Modal
                title="查找聊天记录"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
                styles={{
                    body: {
                        maxHeight: '60vh',
                        overflowY: 'auto',
                    },
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="按发送人筛选"
                        value={searchSender}
                        onChange={(e) => setSearchSender(e.target.value)}
                        style={{ marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="date"
                            onChange={(e) => setSearchStartDate(e.target.value)}
                            value={searchStartDate}
                        />
                        <input
                            type="date"
                            onChange={(e) => setSearchEndDate(e.target.value)}
                            value={searchEndDate}
                        />
                        <Button onClick={handleFilter}>筛选</Button>
                    </div>
                </div>

                <List
                    size="small"
                    dataSource={filteredMessages}
                    renderItem={(msg) => (
                        <List.Item>
                            <div>
                                <div><strong>{msg.sender}</strong> [{formatDate(msg.timestamp)}]</div>
                                <div>{msg.content}</div>
                            </div>
                        </List.Item>
                    )}
                />
            </Modal>

            {/* 聊天内容区域 */}
            {/* 这里使用了一个 div 包裹 List.Item，给每个消息添加了一个唯一的 id */}
            {/* 这样在点击消息时可以滚动到对应的消息位置 */}
            <Content style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                <List
                    dataSource={[...messages].reverse()}  // ⚠️ 不要直接 reverse(messages)，要复制一份
                    renderItem={(item) => (
                        <div id={`msg-${item.id}`}>
                            <List.Item
                                style={{
                                    justifyContent: item.sender === currentUser ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {/* 好友头像 */}
                                {item.sender != currentUser && (
                                    <Avatar
                                        src={
                                            isGroupChat
                                                ? "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net" + groupAvatars[item.sender]
                                                : friendAvatar
                                        }
                                    />
                                )}

                                {/* 右键菜单: 回复和删除 */}
                                <Popover
                                    content={
                                        <Space direction="horizontal" size="small">
                                            <Button type="link" size="small" onClick={() => handleReply(item.id)}
                                                icon={<MessageOutlined />}>
                                                回复
                                            </Button>

                                            <Button type="link" size="small"
                                                onClick={() => handleDelete(item.id)}
                                                icon={<DeleteOutlined />}
                                                danger  // 删除操作通常会加danger属性让按钮变红
                                            >
                                                删除
                                            </Button>
                                        </Space>
                                    }
                                    trigger="contextMenu"
                                >

                                    {/* 消息气泡 */}
                                    <Space
                                        align="end"
                                        style={{
                                            maxWidth: '70%',
                                            background: item.sender === currentUser ? '#e6e0ff' : '#ffffff',
                                            padding: '8px 12px',
                                            borderRadius: '16px',
                                            flexDirection: 'column',
                                            alignItems: item.sender === currentUser ? 'flex-end' : 'flex-start',
                                        }}
                                    >

                                        {/* 回复的消息内容 */}
                                        {item.replyToId && (() => {
                                            const repliedMsg = messages.find((msg) => msg.id === item.replyToId);
                                            if (!repliedMsg) {
                                                return (
                                                    <div
                                                        style={{
                                                            padding: '6px 12px',
                                                            marginBottom: '4px',
                                                            backgroundColor: '#fafafa',
                                                            borderLeft: '3px solid #d9d9d9',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        回复：（内容已丢失）
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    style={{
                                                        padding: '6px 12px',
                                                        marginBottom: '4px',
                                                        backgroundColor: '#fafafa',
                                                        borderLeft: '3px solid #d9d9d9',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                    }}
                                                    onClick={() => scrollToMessage(repliedMsg.id)}
                                                >
                                                    回复 @{repliedMsg.sender}：
                                                    {repliedMsg.msgType === 'image' ? (
                                                        <Image
                                                            src={repliedMsg.content}
                                                            alt="被回复的图片"
                                                            style={{ maxWidth: 60, maxHeight: 60, borderRadius: 4, marginLeft: 8 }}
                                                            preview={{
                                                                mask: '点击预览',
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ marginLeft: 8 }}>
                                                            {repliedMsg.content.slice(0, 30)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}


                                        {/* 发送的消息内容 */}
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
                                            {item.sender === currentUser && (
                                                isGroupChat ? (
                                                    <Tooltip
                                                        title={
                                                            item.readBy && item.readBy.length > 0
                                                                ? `已读成员：${item.readBy.join(', ')}`
                                                                : '尚未有人阅读'
                                                        }
                                                    >
                                                        {item.readBy && item.readBy.length === totalMembers - 1 ? ( // 除去自己
                                                            <CheckCircleTwoTone twoToneColor="#52c41a" title="全部已读" />
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                                                <ClockCircleOutlined style={{ color: '#aaa' }} />
                                                                <span style={{ fontSize: '0.75em', color: '#888' }}>
                                                                    已读 {item.readBy?.length ?? 0}/{totalMembers - 1}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </Tooltip>
                                                ) : (
                                                    item.isRead ? (
                                                        <CheckCircleTwoTone twoToneColor="#52c41a" title="对方已读" />
                                                    ) : (
                                                        <ClockCircleOutlined style={{ color: '#aaa' }} title="等待对方阅读" />
                                                    )
                                                )
                                            )}

                                            <Text type="secondary" style={{ fontSize: '0.75em' }}>
                                                {item.timestamp}
                                            </Text>
                                        </div>

                                        {/* 被回复次数（仅在有回复时展示） */}
                                        {item.replyCount > 0 && (
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: '0.75em',
                                                    marginTop: 4,
                                                    alignSelf: item.sender === currentUser ? 'flex-end' : 'flex-start'
                                                }}>
                                                💬 {item.replyCount} 条回复
                                            </Text>
                                        )}
                                    </Space>
                                </Popover>

                                {/* 自己头像 */}
                                {item.sender == currentUser && (
                                    <Avatar
                                        src={
                                            isGroupChat
                                                ? "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net" + groupAvatars[item.sender]
                                                : myAvatar
                                        }
                                    />
                                )}

                            </List.Item>
                        </div>
                    )}
                />
                <div ref={messageEndRef} />
            </Content>

            {/* 底部: 输入区域 */}
            <Footer style={{ padding: '8px 16px' }}>
                {/* ====== 回复提示栏：显示正在回复的消息内容 ====== */}
                {replyingMessage && (
                    <div
                        style={{
                            padding: '6px 12px',
                            background: '#f0f5ff',
                            borderLeft: '4px solid #1890ff',
                            marginBottom: '8px',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <Text type="secondary">
                                正在回复：{replyingMessage.content.slice(0, 30)}...
                            </Text>
                        </div>
                        <Button size="small" type="link" onClick={() => setReplyToId(null)}>
                            取消
                        </Button>
                    </div>
                )}

                {/* ====== 输入区域 & 按钮栏 ====== */}
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
        </Layout>
    );
}


// 工具函数：格式化时间为 yyyy/mm/dd hh:mm:ss
function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
}