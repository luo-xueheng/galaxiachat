'use client';

import { use, useEffect, useRef, useState } from 'react';
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
import { createSelectorCreator } from '@reduxjs/toolkit';

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
    const [adminList, setAdminList] = useState<string[]>([]);
    const [creator, setcreator] = useState<string>(""); // 创建者
    const [currentUserRole, setCurrentUserRole] = useState("member");
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
        const newAdminList: string[] = [];
        const allGroupMembers: { username: string; role: string; avatar: string }[] = [];
        let newcreator = ""
        // 处理管理员数组
        for (const user of targetGroup.members || []) {
            if (user.role === "creator") {
                newcreator = user.username;
            } else if (user.role === "admin") {
                newAdminList.push(user.username);
            }
        }

        const currentUserName = localStorage.getItem("userName");
        let currentUserRole = "member"; // 默认是普通成员


        // 加入普通成员
        for (const user of targetGroup.members || []) {
            allGroupMembers.push({
                username: user.username,
                role: user.role, // 一般是 "member"
                avatar: user.avatar || "",
            });
            //判断当前用户身份
            if (user.username === currentUserName) {
                currentUserRole = user.role; // 'admin' 或 'member'
            }
        }

        console.log("全部群成员（含角色）:", allGroupMembers);
        setAdminList(newAdminList);
        setcreator(newcreator);
        setGroupMembers(allGroupMembers);

        setCurrentUserRole(currentUserRole);  // 存到状态里
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

    // 添加成员按钮
    const AddMemberDropdown = () => (
        <Dropdown
            menu={{
                items: friendOptions.map(({ label, value }) => ({
                    key: value,
                    label,
                    value,
                    type: 'item', // 添加了 'type' 属性
                    onClick: async (info) => {
                        const invitee_name = info.key;
                        try {
                            if (ws && ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({
                                    action: "send_invite",
                                    group_id: groupId,
                                    invitee_name: invitee_name,
                                    inviter_name: currentUser,

                                }));
                            } else {
                                console.warn("⚠️ WebSocket 尚未连接");
                            }
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

    // 删除成员的下拉菜单项
    const removableMembers = groupMembers.filter(member => {
        if (member.username === currentUser) return false; // 不能移除自己
        if (currentUserRole === "creator") return true;    // 群主可移除任何人（除自己）
        if (currentUserRole === "admin") {
            return member.role === "member";               // 管理员只能移除普通成员
        }
        return false; // 普通成员不能移除任何人
    });

    const removeMemberItems: MenuProps['items'] = removableMembers.map(member => ({
        key: member.username,
        label: member.username,
    }));
    // 删除成员按钮
    const RemoveMemberDropdown = () => (
        <Dropdown
            menu={{
                items: removeMemberItems,
                selectable: true,
                onClick: async ({ key }) => {
                    const confirm = window.confirm(`确认移除成员 ${key} 吗？`);
                    if (!confirm) return;

                    const token = localStorage.getItem("token");
                    try {
                        const res = await fetch(`${BACKEND_URL}/api/remove-member`, {
                            method: "POST",
                            headers: {
                                Authorization: token,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                userName: key,
                                conversation_id: groupId,
                            }),
                        });
                        const result = await res.json();
                        if (result.code === 0) {
                            alert("移除成功");
                            getGroupMembers(); // 重新刷新成员列表
                        } else {
                            alert(`移除失败: ${result.message || "未知错误"}`);
                        }
                    } catch (err) {
                        alert("请求失败，请稍后重试");
                    }
                }

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

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");

        if (!storedToken || !storedUserName) {
            router.push('/login'); // ✅ 如果没登录，立刻跳转
            return;
        }
        dispatch(setToken(storedToken));
        dispatch(setName(storedUserName));

        const initWebSocket = async () => {
            try {
                console.log("🔌 初始化 WebSocket 连接");
                await connectWebSocket();

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("📨 收到 WebSocket 消息：", data);
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
    }, []);

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

