'use client';

import {
    Button,
    Flex,
    List,
    Avatar,
    Collapse,
    Typography,
    message,
    Popconfirm,
    Dropdown,
    Menu,
    Select,
} from "antd";
import {
    InfoCircleOutlined
} from '@ant-design/icons';
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { setName, setToken } from "../../redux/auth";
import { RootState } from "../../redux/store";
import {
    BACKEND_URL,
    FAILURE_PREFIX,
    LOGOUT_SUCCESS,
    LOGOUT_FAILED,
} from "../../constants/string";
import { WsGroupMessage } from "../../api";
import { resolve } from "path";

const { Panel } = Collapse;
const { Title } = Typography;

type Friend = {
    userName: string;
    avatar: string;
};

type Group = {
    id: string;
    name: string;
    type: string;
    users: Friend[];
};


export default function FriendListPage() {
    const userName = useSelector((state: RootState) => state.auth.name);
    const router = useRouter();
    const dispatch = useDispatch();

    const [groups, setGroups] = useState<Group[]>([]);
    const [uncategorized, setUncategorized] = useState<Friend[]>([]);
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [groupError, setGroupError] = useState<string | null>(null);
    const [groupToDelete, setGroupToDelete] = useState("");

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

    const fetchFriends = async () => {
        const token = localStorage.getItem("token");
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/api/user/friends`, {
                headers: { Authorization: `${token}` },
            });
            const data = await res.json();
            console.log("获取好友列表", data);
            if (data.code === 0) {
                setGroups(data.data.groups || []);
                setUncategorized(data.data.uncategorized || []);
            } else {
                message.error("获取好友列表失败：" + data.message);
            }
        } catch (err) {
            message.error("请求好友列表失败");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchFriends();
        fetchGroupTypes();
    }, []);

    const fetchGroupTypes = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${BACKEND_URL}/api/friends/groups`, {
                method: "GET",
                headers: { Authorization: `${token}` },
            });
            const data = await res.json();
            if (data.code === 0 && Array.isArray(data.groups)) {
                setAvailableGroups(data.groups);  // 更新可用的分组数据
            }
        } catch (err) {
            console.error("获取分组失败", err);
        }
    };
    const addGroup = async () => {
        const token = localStorage.getItem("token");
        if (!newGroupName.trim()) {
            message.warning("请输入分组名称");
            return;
        }
        try {
            const res = await fetch(`${BACKEND_URL}/api/friends/create-groups`, {
                method: "POST",
                headers: {
                    Authorization: `${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ group_name: newGroupName }),
            });
            const data = await res.json();
            if (data.code === 0) {
                message.success(`添加分组 ${newGroupName} 成功`);
                setNewGroupName("");
                fetchGroupTypes();
                fetchFriends();
            }
            else if (data.code === 2 && data.info === "Group name already exists") {
                setGroupError(`分组 "${newGroupName}" 已存在`);
            }
            else {
                message.error("添加失败：" + data.message);
            }
        } catch (err) {
            console.error(err);
            message.error("网络请求失败");
        }
    };
    // 删除分组
    const deleteGroup = async () => {
        const token = localStorage.getItem("token");
        if (!selectedGroupId) {
            message.warning("请选择一个分组");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/friends/delete-groups`, {
                method: "DELETE",
                headers: {
                    Authorization: `${token}`,
                },
                body: JSON.stringify({ group_name: selectedGroupId }),
            });
            const data = await res.json();
            console.log("删除分组返回" + data)
            if (data.code === 0) {
                message.success("删除成功");
                // 更新分组列表
                fetchGroupTypes();
                setSelectedGroupId(null);
            } else {
                message.error(data.message || "删除失败");
            }
        } catch (err) {
            console.error("删除失败", err);
            message.error("删除失败");
        }
    };




    //删除好友
    const handleDelete = async (userNameToDelete: string, groupId?: string) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${BACKEND_URL}/api/user/delete`, {
                method: "DELETE",
                headers: {
                    Authorization: `${token}`,
                },
                body: JSON.stringify({ userName: userNameToDelete }),
            });
            const data = await response.json();
            console.log("删除好友返回：", data)
            if (data.code === 0) {
                message.success(`已删除好友 ${userNameToDelete}`);
                // 本地移除该好友
                if (groupId) {
                    // 从某个分组中移除
                    setGroups(prev =>
                        prev.map(g => g.id === groupId
                            ? { ...g, users: g.users.filter(u => u.userName !== userNameToDelete) }
                            : g
                        )
                    );
                } else {
                    // 从未分组列表中移除
                    setUncategorized(prev => prev.filter(u => u.userName !== userNameToDelete));
                }
            } else {
                message.error("删除失败：" + data.message);
            }
        } catch (err) {
            console.error("删除好友失败", err);
            message.error("删除请求失败");
        }
    };

    //将好友移动到某一分组
    const moveToGroup = async (friendName: string, group: string) => {
        const token = localStorage.getItem("token");
        try {
            const requestBody = JSON.stringify({
                userName: friendName,
                group: group, // 空字符串即可
            });

            const res = await fetch(`${BACKEND_URL}/api/friends/move`, {
                method: "PUT",
                headers: {
                    Authorization: `${token}`,
                    "Content-Type": "application/json",
                },
                body: requestBody,
            });

            const data = await res.json();
            if (data.code === 0) {
                if (group) {
                    message.success(`已将 ${friendName} 移入 ${group}`);
                } else {
                    message.success(`已将 ${friendName} 移出分组`);
                }
                fetchFriends();
            } else {
                message.error("分组失败：" + data.message);
            }
        } catch (err) {
            console.error(err);
            message.error("网络请求失败");
        }
    };

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
                    `/chat/${conversationId}?${new URLSearchParams({
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

    //点击搜索结果，跳转用户信息界面
    const handleSearchItemClick = async (username: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BACKEND_URL}/api/user/${username}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
            });

            const data = await response.json();
            console.log('获取用户信息成功：', data);
            const conversationName = data.conversation_name;
            console.log("会话名称：", conversationName);
            const isGroupChat = data.is_group;
            console.log("是否为群聊：", isGroupChat);
            router.push(`/mainpage/friends/friendinfo?infoUserName=${username}`);

        } catch (error) {
            console.error('获取用户信息详情失败：', error);
            return null;
        }

    };

    // 渲染好友列表时，提供分组选择功能, 以及进入会话功能
    const renderFriendList = (friends: Friend[], showGroupOptions = false, groupId?: string) => (
        <List
            itemLayout="horizontal"
            dataSource={friends}
            renderItem={(friend) => (
                <List.Item
                    actions={[
                        showGroupOptions ? (
                            <div key="group-options">
                                {availableGroups.map((group) => (
                                    <Button
                                        size="small"
                                        style={{ marginRight: 4, marginBottom: 4 }}
                                        key={group}
                                        onClick={() => moveToGroup(friend.userName, group)}
                                    >
                                        加入 {group}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <Dropdown
                                key="group"
                                overlay={
                                    <Menu
                                        onClick={({ key }) => moveToGroup(friend.userName, key)}
                                        items={[
                                            ...availableGroups.map((g) => ({
                                                key: g,
                                                label: `移动到 ${g}`,
                                            })),
                                            {
                                                key: "", // 空字符串表示移出分组
                                                label: "移出分组",
                                            },
                                        ]}
                                    />
                                }
                            >
                                <Button>移动到分组</Button>
                            </Dropdown>
                        ),
                        <Popconfirm
                            title="确认删除该好友？"
                            onConfirm={() => handleDelete(friend.userName, groupId)}
                            okText="确认"
                            cancelText="取消"
                            key="delete"
                        >
                            <Button danger>删除</Button>
                        </Popconfirm>,
                        <>
                            <Button
                                key="chat"
                                onClick={() => handleCreateConversation(friend.userName)}
                            >
                                发消息
                            </Button>

                            <Button
                                type="primary"
                                onClick={() => handleSearchItemClick(friend.userName)}
                                icon={<InfoCircleOutlined />}
                            >
                            </Button>
                        </>,

                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar src={friend.avatar} />}
                        title={friend.userName}
                    />
                </List.Item>
            )}
        />
    );



    return (
        <Flex vertical gap="middle" style={{ padding: 24 }}>


            <Flex gap="middle" style={{ marginTop: 16 }}>
                <div>
                    <input
                        type="text"
                        placeholder="新分组名"
                        value={newGroupName}
                        onChange={(e) => {
                            setNewGroupName(e.target.value)
                            setGroupError(null); // 清除错误信息
                        }}
                    />
                    <Button type="primary" onClick={addGroup} style={{ marginLeft: 8 }}>
                        添加分组
                    </Button>
                    {groupError && (
                        <div style={{ color: "red", marginTop: 4 }}>{groupError}</div>
                    )}
                </div>
                <div>
                    <Select
                        placeholder="选择要删除的分组"
                        style={{ width: 200 }}
                        value={selectedGroupId}
                        onChange={(value) => setSelectedGroupId(value)}
                        options={availableGroups.map((group) => ({
                            label: group,
                            value: group,
                        }))}
                    />
                    <Button danger onClick={deleteGroup} style={{ marginLeft: 8 }}>
                        删除分组
                    </Button>
                </div>
            </Flex>

            <Title level={3}>好友列表</Title>
            <Button onClick={fetchFriends} loading={loading}>
                刷新好友列表
            </Button>
            <Collapse
                defaultActiveKey={["uncategorized", ...(groups?.map((g) => g.id) || [])]}
            >
                <Panel header="未分组" key="uncategorized">
                    {renderFriendList(uncategorized, true)}
                </Panel>
                {groups.map((group) => (
                    <Panel header={group.name} key={group.id}>
                        {renderFriendList(group.users, false, group.id)}
                    </Panel>
                ))}
            </Collapse>
        </Flex>
    );
};
