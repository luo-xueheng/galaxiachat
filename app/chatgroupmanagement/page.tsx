'use client';
import { Suspense } from 'react';
import { use, useEffect, useRef, useState } from 'react';
import type { MenuProps } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space, Popover, Image, Row, Col, Dropdown, Divider, Collapse, Select } from 'antd';
import { SmileOutlined, PictureOutlined } from '@ant-design/icons';
import { SendOutlined, CheckCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { DownOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';
const { Header, Content, Footer } = Layout;
import { setName, setToken } from "../redux/auth";
const { Text } = Typography;
import { BACKEND_URL } from "../constants/string";
import { useRouter } from 'next/navigation';
import { Modal } from 'antd';
import { Friend, GroupInviteRequest, GroupInviteResponse, WsGroupMessage } from '../api';
import { connect } from 'http2';
const PENDING_REQUESTS_KEY = 'pendingFriendRequests';
type announcelist = {
    content: string;
    created_at: number;
};
type groupmember = {
    username: string;
    role: string;
    avatar: string;
    is_friend: boolean;
    is_requested: boolean;
};



const ChatGroupManagement = () => {
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
    const [historyAnnounceList, setHistoryAnnounceList] = useState<announcelist[]>([]); // 历史公告列表
    const [allFriends, setAllFriends] = useState<Friend[]>([]); // 所有好友列表
    // 定义用于保存公告的 state
    const [announcementDraft, setDraft] = useState('');
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


    const collapseItems = historyAnnounceList.map((item, index) => ({
        key: String(index),
        children: <p>{item.content}</p>,
    }));

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const [memberAvatar, setMemberAvatar] = useState<string | undefined>(undefined);

    const [socket, setSocket] = useState<WebSocket | null>(null);

    // Declare modalOpen state and set the default value to false
    const [modalOpen, setModalOpen] = useState(false);
    const [modal1Open, setModal1Open] = useState(false);
    const [modal2Open, setModal2Open] = useState(false);

    // Function to show the modal
    const showModal = () => {
        setModalOpen(true);
    };


    // 打开和关闭 modal
    const showModal1 = () => setModal1Open(true);
    const handleCancel1 = () => {
        setModal1Open(false);
    };
    const [selectedAdminUsername, setSelectedAdminUsername] = useState(null);

    // 打开和关闭 modal
    const showModal2 = () => setModal2Open(true);
    const handleCancel2 = () => {
        setModal2Open(false);
    };
    const [selectedNewCreator, setSelectedNewCreator] = useState(null);


    //获取全部群成员
    //同时也实现了判断当前用户身份和获取历史群公告
    const getGroupMembers = async () => {
        const token = localStorage.getItem("token");
        const resfriend = await fetch(`${BACKEND_URL}/api/user/friends`, {
            headers: { Authorization: `${token}` },
        });
        const datafriend = await resfriend.json();

        const uncategorizedFriends: Friend[] = datafriend.data.uncategorized;
        const categorizedGroups: { users: Friend[] }[] = datafriend.data.groups;
        const categorizedFriends = categorizedGroups.flatMap(group => group.users);

        const allFriends = [...uncategorizedFriends, ...categorizedFriends];
        console.log("全部好友ingetgroupmembers", allFriends);
        const res = await fetch(`${BACKEND_URL}/api/group-info?conversation_id=${groupId}`, {
            method: "GET",
            headers: {
                Authorization: `${token}`,
            },
        });

        const data = await res.json();
        const targetGroup = data.groups?.[groupId];
        const newAdminList: string[] = [];
        const allGroupMembers = [] as groupmember[];
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
                is_friend: allFriends.some(friend => friend.userName === user.username),
                is_requested: localStorage.getItem(`${PENDING_REQUESTS_KEY}_${currentUserName}_${user.username}`) === 'true',
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
        setHistoryAnnounceList(targetGroup.announcements); // 历史公告列表
        // console.log("当前历史群公告", historyAnnounceList);
        console.log("最新历史群公告", targetGroup.announcements);
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
            setAllFriends(allFriends); // 用于后续的其他操作
        } catch (err) {
            // message.error("请求好友列表失败");
        }
    };
    //通过群聊添加好友
    const addFriend = async (item: groupmember) => {
        getGroupMembers(); // 重新获取群成员列表
        try {
            const ws = new WebSocket(
                `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(localStorage.getItem("token"))}`
            );
            ws.onopen = () => {
                ws.send(JSON.stringify({
                    action: "send_request",
                    userName: item.username,
                    request_type: "direct",
                }));
            };
            ws.onerror = (e) => {
                console.error("❌ WebSocket 连接错误", e);
            };

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    console.log("📤 发送申请响应：", event.data);
                    if (response.status === "error" && response.code === "request_exists") {
                        alert("已发送过好友申请，请勿重复发送！")
                    }
                    if (response.status === "success") {
                        alert(`好友请求已成功发送给 ${item.username}`);
                        const request_id = response.request_id;

                        // const newPendingList = [...getPendingRequests(), { userName: item.userName, request_id }];
                        // setPendingRequests(newPendingList);

                        // setResults(prev =>
                        //     prev.map(user =>
                        //         user.userName === item.userName ? { ...user, is_requested: true } : user
                        //     )
                        // );
                        localStorage.setItem(`${PENDING_REQUESTS_KEY}_${currentUser}`, 'true');
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
                    onClick: async () => {
                        const token = localStorage.getItem("token");
                        console.log("当前token", token);
                        try {
                            const res = await fetch(`${BACKEND_URL}/api/send-group-invitation`, {
                                method: "POST",
                                headers: {
                                    Authorization: token,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    conversation_id: groupId,
                                    invitee: value,
                                }),
                            });
                            const result = await res.json();
                            if (result.info === "Succeed") {
                                alert(`成功将进群邀请发送给好友${value}，待对方和群主管理员确认后方可入群`);
                            }
                            else if (result.code === 5) {
                                alert(`进群申请已发送给好友${value}，请勿重复发送！`);
                            }
                            else {
                                alert(`邀请失败: ${result.message || "未知错误"}`);
                            }
                        } catch (err) {
                            alert("请求失败，请稍后重试");
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
            return member.role === "normal";               // 管理员只能移除普通成员
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

    //发送群公告
    const handleSendAnnounce = () => {
        const token = localStorage.getItem("token");
        console.log("当前groupid", groupId)
        fetch(`${BACKEND_URL}/api/publish-announcement`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation_id: groupId,
                content: announcementDraft,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (Number(res.code) === 0) {
                    alert("发送群公告成功");
                }
                else {
                    console.log("发送群公告失败", res);
                }
            })
        setDraft(''); // 清空草稿
        setModalOpen(false);
        getGroupMembers(); // 通过调用大接口重新获取历史公告

    };

    // 保存公告的函数
    const saveAnnounce = () => {
        console.log("保存公告:", announcementDraft);
        setModalOpen(false);
    };
    //取消公告
    const handleCancelAnnounce = () => {
        setModalOpen(false);
        setDraft(''); // 清空草稿
    };

    // 筛选出非管理员成员
    const nonAdminMembers = groupMembers.filter(member => {
        if (member.username === currentUser) return false; // 群主不能把自己设成管理员
        if (member.role === "admin") return false;  //已经是管理员的不能重复设置
        else return true;
    });
    // 添加管理员的函数
    const handleAddAdmin = () => {
        const token = localStorage.getItem("token");
        console.log("当前groupid", groupId)
        fetch(`${BACKEND_URL}/api/set-admin`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName: selectedAdminUsername,
                conversation_id: groupId,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (Number(res.code) === 0) {
                    getGroupMembers();
                    alert("添加管理员成功");
                }
                else {
                    console.log("添加管理员失败", res);
                }
            })
        setModal1Open(false);
        getGroupMembers(); // 通过调用大接口重新获取管理员信息
    }

    // 筛选出新群主
    const nonCreator = groupMembers.filter(member => {
        if (member.username === currentUser) return false; // 新群主不能选自己
        else return true;
    });
    // 添加管理员的函数
    const TransferOwnership = () => {
        const token = localStorage.getItem("token");
        console.log("当前groupid", groupId)
        fetch(`${BACKEND_URL}/api/transfer-ownership`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName: selectedNewCreator,
                conversation_id: groupId,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (Number(res.code) === 0) {
                    getGroupMembers();
                    alert("群主转让成功");
                }
                else {
                    console.log("群主转让失败", res);
                }
            })
        setModal2Open(false);
        getGroupMembers(); // 通过调用大接口重新获取群主信息
    }

    useEffect(() => {

        const storedToken = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");

        if (!storedToken || !storedUserName) {
            router.push('/login'); // ✅ 如果没登录，立刻跳转
            return;
        }

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

    useEffect(() => {
        try {
            const ws = new WebSocket(
                `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(localStorage.getItem("token"))}`
            );
            ws.onerror = (e) => {
                console.error("❌ WebSocket 连接错误", e);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("📨 收到 WebSocket 消息：", data);

                if (data.type === "friend_request_response") {
                    const { receiver_name, status } = data;

                    alert(`${receiver_name} ${status === "accepted" ? '接受' : '拒绝'}了你的好友请求`);
                }
                // 👇 WebSocket 收到后立即响应（例如发送一个 acknowledge）
                if (ws && ws.readyState === WebSocket.OPEN && data.type === "friend_request_response") {
                    ws.send(JSON.stringify({
                        action: "acknowledge",
                        request_id: data.request_id,
                    }));
                }
            };
        } catch (error) {
            alert('连接服务器失败，请稍后重试');
        }

    }, [dispatch, router]);

    const handleLeaveGroup = () => {
        const token = localStorage.getItem("token");
        if (currentUserRole === "creator") {
            alert("群主不能退出群聊，请先转让群主身份")
            return;
        }
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
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        群聊管理
                    </Typography.Title>
                </div>
            </Header>
            {/* 包裹群聊信息标题和 Divider */}
            <div style={{ paddingLeft: 24 }}>
                <Divider style={{ margin: '16px 0' }} />
                <Typography.Title level={4}>群聊信息</Typography.Title>
                <Content style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                    <Typography.Title level={5}>
                        群聊名称: {groupname}
                    </Typography.Title>
                    <Typography.Title level={5}>
                        群成员：
                    </Typography.Title>
                    <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        {groupMembers.map((member, index) => (
                            <div key={index} style={{ textAlign: 'center', marginRight: 16 }}>
                                <Avatar src={member.avatar} size={64} />
                                <div>{member.username}</div>
                                <div>{member.role}</div>
                                {member.username != currentUser && (
                                    <Button
                                        type="primary"
                                        onClick={() => addFriend(member)}
                                        disabled={member.is_friend || member.is_requested}
                                    >
                                        {member.is_friend ? "已添加" : member.is_requested ? "已申请" : "添加好友"}
                                    </Button>

                                )}
                            </div>
                        ))}

                        {/* 添加成员按钮 */}
                        <AddMemberDropdown />
                        {/* 只有当 member.role 不是 'normal' 时才显示移除成员按钮 */}
                        {currentUserRole !== 'normal' && (
                            <RemoveMemberDropdown />
                        )}
                    </div>
                    <Typography.Title level={5}>
                        历史群公告：
                    </Typography.Title>
                    <Collapse accordion items={collapseItems} />
                </Content>
            </div>
            {(currentUserRole === "creator" || currentUserRole === "admin") && (
                <div style={{ paddingLeft: 24 }}>
                    <Content style={{ padding: '16px', overflowY: 'auto' }}>
                        <Divider style={{ margin: '16px 0' }} />
                        <Button type="default" onClick={showModal} style={{ marginLeft: '16px' }}>
                            发送群公告
                        </Button>
                        <Modal
                            title="公告编辑"
                            open={modalOpen}
                            onOk={handleSendAnnounce}
                            onCancel={handleCancelAnnounce}
                        >
                            <Input.TextArea
                                rows={4}
                                value={announcementDraft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="请输入群公告内容"
                            />
                            <Button type="primary" onClick={saveAnnounce} style={{ marginTop: 8 }}>
                                保存公告
                            </Button>
                        </Modal>

                    </Content>
                </div>
            )}
            {/* 包裹群主权限的Divider */}
            {currentUserRole === "creator" && (
                <div style={{ paddingLeft: 24 }}>
                    <Divider style={{ margin: '16px 0' }} />
                    <Typography.Title level={4}>群主权限</Typography.Title>
                    <Content style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                        {(currentUserRole === "creator") && (
                            <Button type="default" onClick={showModal1} style={{ marginLeft: '16px' }}>
                                添加群管理员
                            </Button>
                        )}
                        <Modal
                            title="添加群管理员"
                            open={modal1Open}
                            onOk={handleAddAdmin}
                            onCancel={handleCancel1}
                            okButtonProps={{ disabled: !selectedAdminUsername }}
                        >
                            <p>请选择要设为管理员的成员：</p>
                            <Select
                                placeholder="选择一个成员"
                                onChange={(value) => setSelectedAdminUsername(value)}
                                style={{ width: '100%' }}
                            >
                                {nonAdminMembers.map((member) => (
                                    <Select.Option key={member.username} value={member.username}>
                                        {member.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Modal>
                        {(currentUserRole === "creator") && (
                            <Button type="default" onClick={showModal2} style={{ marginLeft: '16px' }}>
                                群主转让
                            </Button>
                        )}
                        <Modal
                            title="群主转让给其他群成员"
                            open={modal2Open}
                            onOk={TransferOwnership}
                            onCancel={handleCancel2}
                            okButtonProps={{ disabled: !selectedNewCreator }}
                        >
                            <p>将群主转让给：</p>
                            <Select
                                placeholder="选择一个成员"
                                onChange={(value) => setSelectedNewCreator(value)}
                                style={{ width: '100%' }}
                            >
                                {nonCreator.map((member) => (
                                    <Select.Option key={member.username} value={member.username}>
                                        {member.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Modal>
                    </Content>
                </div>
            )}
            <Footer style={{ textAlign: 'center', position: 'relative', bottom: 0, width: '100%' }}>
                <Button type="primary" onClick={handleLeaveGroup}>
                    退出群聊
                </Button>
            </Footer>
        </Layout>
    );
}
export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChatGroupManagement />
        </Suspense>
    );
}
