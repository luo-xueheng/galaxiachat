'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuProps } from 'antd';
import { useParams, useSearchParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space, Popover, Image, Row, Col, Dropdown } from 'antd';
import { SmileOutlined, PictureOutlined } from '@ant-design/icons';
import { SendOutlined, CheckCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { DownOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';
const { Header, Content, Footer } = Layout;
const { Text } = Typography;
import { BACKEND_URL } from "../constants/string";
import { useRouter } from 'next/navigation';
import { get } from 'http';

type Friend = {
    userName: string;
    avatar: string;
};
export default function ChatPage() {
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
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${BACKEND_URL}/api/add-member`, {
                            method: "POST",
                            headers: {
                                Authorization: `${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ group_id: groupId, user_name: value }),
                        });
                        const data = await res.json();
                        if (data.success) {
                            alert(`成员 ${label} 已添加`);
                            // 重新加载群成员
                            getGroupMembers();
                        } else {
                            alert(`添加失败: ${data.message}`);
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
        let creator: string | null = null;
        const adminList: string[] = [];
        const memberList: string[] = [];

        // 处理管理员数组
        for (const user of targetGroup.admins || []) {
            if (user.role === "creator") {
                creator = user.username;
            } else if (user.role === "admin") {
                adminList.push(user.username);
            }
        }

        const allGroupMembers: { username: string; role: string; avatar: string }[] = [];

        // // 加入群主和管理员
        // for (const user of targetGroup.admins || []) {
        //     allGroupMembers.push({
        //         username: user.username,
        //         role: user.role, // "creator" 或 "admin"
        //     });
        // }

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

                    {/* 添加成员按钮
                    <div style={{ textAlign: 'center', marginRight: 16 }}>
                        <Button
                            shape="default"
                            size="large"
                            icon={<span style={{ fontSize: 24 }}>+</span>}
                            style={{ width: 64, height: 64, padding: 0 }}
                            onClick={() => {
                                alert("添加成员");
                            }}
                        />
                        <div>添加成员</div>
                    </div> */}

                    {/* 移除成员按钮
                    <div style={{ textAlign: 'center', marginRight: 16 }}>
                        <Button
                            shape="default"
                            size="large"
                            icon={<span style={{ fontSize: 24 }}>−</span>}
                            style={{ width: 64, height: 64, padding: 0 }}
                            onClick={() => {
                                alert("移除成员");
                            }}
                        />
                        <div>移除成员</div>
                    </div> */}
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

