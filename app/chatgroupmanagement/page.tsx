'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuProps } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space, Popover, Image, Row, Col, Dropdown } from 'antd';
import { SmileOutlined, PictureOutlined } from '@ant-design/icons';
import { SendOutlined, CheckCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { DownOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';
const { Header, Content, Footer } = Layout;
import { setName, setToken } from "../redux/auth";
const { Text } = Typography;
import { BACKEND_URL } from "../constants/string";
import { useRouter } from 'next/navigation';
import { get } from 'http';
import { group } from 'console';

type Friend = {
    userName: string;
    avatar: string;
};
let ws: WebSocket | null = null;
const connectWebSocket = async (): Promise<WebSocket> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error("❌ Token 不存在，无法建立 WebSocket 连接");
    }

    return new Promise((resolve, reject) => {
        ws = new WebSocket(
            `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/group-invite/?token=${encodeURIComponent(token)}`
        );

        ws.onopen = () => {
            console.log('✅ WebSocket 连接已建立');
            resolve(ws);
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket 连接错误:', error);
            reject(error);
        };

        ws.onclose = () => {
            console.warn('⚠️ WebSocket 连接已关闭');
            ws = null;
        };
    });
};
export default function ChatPage() {
    const dispatch = useDispatch();
    const [friendOptions, setFriendOptions] = useState<{ label: string; value: string }[]>([]);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const params = useParams();
    const searchParams = useSearchParams();


    const currentUser = localStorage.getItem("userName"); // 获取当前用户的用户名
    const currentUserToken = localStorage.getItem("token"); // 获取当前用户的token
    const friendUserName = searchParams.get("currentChatFriendUserName"); // 获取当前用户的用户名
    const groupname = searchParams.get("currentChatGroupName"); // 获取当前群聊的名称
    const isGroupChat = searchParams.get("isGroupChat"); // 判断是否是群聊
    const groupId = searchParams.get("groupId"); // 获取当前群聊的id
    // const { chatId } = useParams(); // 获取路由中的chatId
    // const groupId = chatId;

    console.log("当前用户: ", currentUser);
    console.log("当前用户token: ", currentUserToken);
    console.log("好友: ", friendUserName);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const showDrawer = () => setDrawerOpen(true);
    const closeDrawer = () => setDrawerOpen(false);
    const router = useRouter();
    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const [memberAvatar, setMemberAvatar] = useState<string | undefined>(undefined);

    const [socket, setSocket] = useState<WebSocket | null>(null);
    // 示例成员列表（你可动态生成）

    const removeMemberItems: MenuProps['items'] = [
        { key: 'dave', label: 'Dave' },
        { key: 'eve', label: 'Eve' },
    ];
    // 添加成员按钮
    const AddMemberDropdown = () => (
        <Dropdown
            menu={{
                items: friendOptions.map(({ label, value }) => ({
                    key: value,
                    label,
                    value,
                    type: 'item', // 添加了 'type' 属性
                    onClick: async () => {
                        try {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({
                                    action: "send_invite",
                                    group_id: groupId,
                                    invitee_name: value,

                                }));
                            } else {
                                console.warn("⚠️ WebSocket 尚未连接");
                            }

                            ws.onmessage = (event) => {
                                try {
                                    const response = JSON.parse(event.data);
                                    console.log("📤 发送申请响应：", event.data);

                                    if (response.status === "success") {
                                        alert(`好友请求已成功发送给 ${value}`);
                                    }
                                    if (response.status === "error" && response.code === "pending_invite_exists") {
                                        alert(`给好友: ${value}的进群申请已存在，请勿重复发送`);
                                    }
                                } catch (e) {
                                    console.error('解析响应失败:', e);
                                    alert('处理服务器响应时出错');
                                }
                            };
                        } catch (error) {
                            console.error('添加好友失败:', error);
                            alert('连接服务器失败，请稍后重试');
                        }
                    },
                })),
            }}
            trigger={['click']}
        >
            <div style={{ textAlign: 'center', marginRight: 16 }}>
                <Button
                    icon={<UserAddOutlined style={{ fontSize: 24 }} />}
                    style={{ width: 64, height: 64, padding: 0 }}
                />
                <div>
                    添加成员 <DownOutlined />
                </div>
            </div>
        </Dropdown>
    );

    // 删除成员按钮
    const RemoveMemberDropdown = () => (
        <Dropdown
            menu={{
                items: removeMemberItems,
                selectable: true,
                onClick: ({ key }) => alert(`移除成员：${key}`),
            }}
            trigger={['click']}
        >
            <div style={{ textAlign: 'center', marginRight: 16 }}>
                <Button
                    icon={<UserDeleteOutlined style={{ fontSize: 24 }} />}
                    style={{ width: 64, height: 64, padding: 0 }}
                />
                <div>
                    移除成员 <DownOutlined />
                </div>
            </div>
        </Dropdown>
    );
    //获取全部群成员
    const getGroupMembers = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/api/group-info?conversation_id=${groupId}`, {
            method: "GET",
            headers: {
                Authorization: `${token}`,
            },
        });

        const data = await res.json();
        console.log("获取群成员", data);
        const targetGroup = data.groups?.[groupId];
        console.log("当前群成员", targetGroup);
        const creator: string | null = null;
        const adminList: string[] = [];
        const memberList: string[] = [];

        // 处理管理员数组
        for (const user of targetGroup.admins || []) {
            if (user.role === "creator") {
                const creator = user.username;
            } else if (user.role === "admin") {
                adminList.push(user.username);
            }
        }

        const allGroupMembers: { username: string; role: string; avatar: string }[] = [];


        // 加入普通成员
        for (const user of targetGroup.members || []) {
            allGroupMembers.push({
                username: user.username,
                role: user.role, // 一般是 "member"
                avatar: user.avatar || "",
            });
        }

        console.log("全部群成员（含角色）:", allGroupMembers);
        setGroupMembers(allGroupMembers);
    };
    const fetchFriends = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${BACKEND_URL}/api/user/friends`, {
                headers: { Authorization: `${token}` },
            });
            const data = await res.json();

            const uncategorizedFriends: Friend[] = data.data.uncategorized;
            const categorizedGroups: { users: Friend[] }[] = data.data.groups;
            const categorizedFriends = categorizedGroups.flatMap(group => group.users);

            const allFriends = [...uncategorizedFriends, ...categorizedFriends];

            // 使用当前群成员列表 groupMembers 进行过滤
            const groupMemberUsernames = new Set(groupMembers.map(member => member.username));
            console.log("当前群成员", groupMemberUsernames);
            const filteredFriends = allFriends.filter(friend => !groupMemberUsernames.has(friend.userName));

            const options = filteredFriends.map(friend => ({
                label: friend.userName,
                value: friend.userName,
            }));
            console.log("过滤后的好友列表", options);
            setFriendOptions(options); // 用于 AddMemberDropdown 渲染
        } catch (err) {
            // message.error("请求好友列表失败");
        }
    };
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");

        if (!storedToken || !storedUserName) {
            router.push('/login'); // ✅ 如果没登录，立刻跳转
            return;
        }
        dispatch(setToken(storedToken));
        dispatch(setName(storedUserName));

        let socket: WebSocket | null = null;

        const initWebSocket = async () => {
            try {
                console.log("🔌 初始化 WebSocket 连接");
                socket = await connectWebSocket();

                socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("📨 收到 WebSocket 消息：", data);

                    if (data.type === "friend_request_response") {
                        // const { receiver_name, status } = data;

                        // const updatedPending = getPendingRequests().filter(p => p.userName !== receiver_name);
                        // setPendingRequests(updatedPending);

                        // setResults(prev =>
                        //   prev.map(user =>
                        //     user.userName === receiver_name
                        //       ? { ...user, is_friend: status === "accepted", is_requested: false }
                        //       : user
                        //   )
                        // );

                        // const currentUser = localStorage.getItem("userName");
                        // const pendingRequestKey = `${PENDING_REQUESTS_KEY}_${currentUser}_${receiver_name}`;
                        // localStorage.removeItem(pendingRequestKey);

                        // alert(`${receiver_name} ${status === "accepted" ? '接受' : '拒绝'}了你的好友请求`);
                    }
                    // 👇 WebSocket 收到后立即响应（例如发送一个 acknowledge）
                    if (ws && ws.readyState === WebSocket.OPEN && data.type === "friend_request_response") {
                        ws.send(JSON.stringify({
                            action: "acknowledge",
                            request_id: data.request_id,
                        }));
                    }
                };
            } catch (err) {
                console.error("WebSocket 初始化失败", err);
            }
        };

        initWebSocket();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [dispatch, router]);
    useEffect(() => {
        const loadData = async () => {
            await getGroupMembers(); // 获取群成员
        };
        loadData();
    }, [groupId]); // 依赖于 groupId 变化

    useEffect(() => {
        if (groupMembers.length > 0) {  // 仅在群成员数据加载完成后执行
            fetchFriends();    // 获取好友并排除已在群内的
        }
    }, [groupMembers]);  // 当 groupMembers 更新时调用 fetchFriends



    const handleLeaveGroup = () => {
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
    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text strong>
                        群聊管理
                    </Text>
                </div>
            </Header>

            <Content style={{ padding: '20px', flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto' }}>
                    {groupMembers.map((member, index) => (
                        <div key={index} style={{ textAlign: 'center', marginRight: 16 }}>
                            <Avatar src={member.avatar} size={64} />
                            <div>{member.username}</div>
                            <div>{member.role}</div>
                        </div>
                    ))}

                    {/* 添加成员按钮 */}
                    <AddMemberDropdown />

                    {/* 移除成员按钮 */}
                    <RemoveMemberDropdown />
                </div>
            </Content>

            <Footer style={{ textAlign: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
                <Button type="primary" onClick={handleLeaveGroup}>
                    退出群聊
                </Button>
            </Footer>
        </Layout>
    );
}

