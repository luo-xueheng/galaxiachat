'use client';
import { Suspense } from 'react';
import { use, useEffect, useRef, useState } from 'react';
import type { MenuProps } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams } from 'next/navigation';
import { Input, Button, Layout, Typography, List, Avatar, Space, Popover, Image, Row, Col, Dropdown, Divider, Collapse } from 'antd';
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

type announcelist = {
    content: string;
    created_at: number;
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

    // Function to show the modal
    const showModal = () => {
        setModalOpen(true);
    };


    //获取全部群成员
    //同时也实现了判断当前用户身份和获取历史群公告
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
                        const request = {
                            invitee: "TODO",
                            conversation_id: "TODO",
                        } as GroupInviteRequest

                        const response = await (await fetch("/api/[TODO]", {
                            method: "POST",
                            // TODO
                        })).json() as GroupInviteResponse

                        if (response.type === "success") {
                            // [TODO]
                        }
                        else if (response.type === "error") {
                            // [TODO]
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

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");

        if (!storedToken || !storedUserName) {
            router.push('/login'); // ✅ 如果没登录，立刻跳转
            return;
        }
        dispatch(setToken(storedToken));
        dispatch(setName(storedUserName));

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
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        群聊管理
                    </Typography.Title>
                </div>
            </Header>
            {/* 包裹群聊信息标题和 Divider */}
            <div style={{ paddingLeft: 24 }}>
                <Divider style={{ margin: '16px 0' }} />
                <Typography.Title level={4}>群聊信息</Typography.Title>
                <Content style={{ padding: '20px', flex: 1 }}>
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
            <Content style={{ padding: '16px' }}>
                <Divider style={{ margin: '16px 0' }} />

                {(currentUserRole === "creator" || currentUserRole === "admin") && (
                    <Button type="default" onClick={showModal} style={{ marginLeft: '16px' }}>
                        发送群公告
                    </Button>
                )}
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
            <Footer style={{ textAlign: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
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
