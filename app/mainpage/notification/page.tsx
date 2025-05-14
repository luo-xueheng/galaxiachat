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

type FriendRequest = {
    request_id: string;
    sender_name: string;
    request_type: string;
};

type GroupRequest = {
    invite_id: string;
    group_name: string;
    inviter_name: string;
    invitee_name: string;
    notification_id: string;
};

let ws_friend_request: WebSocket | null = null;
let ws_group_invite: WebSocket | null = null;

const Page = () => {
    const userName = useSelector((state: RootState) => state.auth.name);
    const router = useRouter();
    const dispatch = useDispatch();

    const [groups, setGroups] = useState<Group[]>([]);
    const [uncategorized, setUncategorized] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [pendingRequestsgroupreview, setPendingRequestsgroupreview] = useState<GroupRequest[]>([]);
    const [pendingRequestsgroupinvitee, setPendingRequestsgroupinvitee] = useState<GroupRequest[]>([]);
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [groupError, setGroupError] = useState<string | null>(null);
    const [groupToDelete, setGroupToDelete] = useState("");

    const [nickname, setNickname] = useState(null);
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");
        if (!storedToken || !storedUserName) {
            alert("请先登录");
            router.push("/login");
            return;
        }
        if (storedToken) dispatch(setToken(storedToken));
        if (storedUserName) dispatch(setName(storedUserName));
        const connectWebSocket = async (): Promise<WebSocket> => {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token 不存在，无法建立 WebSocket 连接");

            return new Promise((resolve, reject) => {
                ws_friend_request = new WebSocket(
                    `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(token)}`
                );

                ws_friend_request.onopen = () => {
                    console.log("✅ WebSocket 连接已建立");
                    resolve(ws_friend_request);
                };

                ws_friend_request.onerror = (error) => {
                    console.error("❌ WebSocket 连接错误:", error);
                    reject(error);
                };

                ws_friend_request.onclose = () => {
                    console.warn("⚠️ WebSocket 连接已关闭");
                    ws_friend_request = null;
                };

                ws_friend_request.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("haoyoushenqing", data)
                    if (data.type === "friend_request" && data.sender_name && data.request_id) {
                        setPendingRequests((prev) => {
                            if (prev.some((r) => r.request_id === data.request_id)) {
                                return prev; // 已存在，忽略
                            }
                            return [...prev, {
                                request_id: data.request_id,
                                sender_name: data.sender_name,
                                request_type: data.request_type,
                            }];

                        });
                    }
                };
            });
        };

        connectWebSocket();
    }, [dispatch]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");
        if (!storedToken || !storedUserName) {
            alert("请先登录");
            router.push("/login");
            return;
        }
        if (storedToken) dispatch(setToken(storedToken));
        if (storedUserName) dispatch(setName(storedUserName));
        // if (storedToken) {
        //     fetchFriends();
        //     fetchGroupTypes();
        // }
        const connectWebSocketgroup = async (): Promise<WebSocket> => {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Token 不存在，无法建立 WebSocket 连接");

            return new Promise((resolve, reject) => {
                ws_group_invite = new WebSocket(
                    `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/notify/?token=${encodeURIComponent(token)}`
                );

                ws_group_invite.onopen = () => {
                    console.log("✅ WebSocket qunlioa连接已建立");
                    resolve(ws_group_invite);
                };

                ws_group_invite.onerror = (error) => {
                    console.error("❌ WebSocket 连接错误:", error);
                    reject(error);
                };

                ws_group_invite.onclose = () => {
                    console.warn("⚠️ WebSocket 连接已关闭");
                    ws_friend_request = null;
                };

                ws_group_invite.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("群聊消息", data);
                    if (data.type === "group_invitation" && data.data.status === "pending_review") {
                        console.log("herependingreview")
                        setPendingRequestsgroupreview((prev) => {
                            if (prev.some((r) => r.invite_id === data.data.invite_id)) {
                                return prev; // 已存在，忽略
                            }
                            return [...prev, {
                                invite_id: data.data.invite_id,
                                group_name: data.data.group_name,
                                inviter_name: data.data.inviter_username,
                                invitee_name: data.data.invitee_username,
                                notification_id: data.notification_id,
                            }];

                        });
                        console.log("pendinggroupreview" + pendingRequestsgroupreview)
                    }
                    else if (data.type === "group_invitation" && data.data.status === "approved") {
                        setPendingRequestsgroupinvitee((prev) => {
                            if (prev.some((r) => r.invite_id === data.data.invite_id)) {
                                return prev; // 已存在，忽略
                            }
                            return [...prev, {
                                invite_id: data.data.invite_id,
                                group_name: data.data.group_name,
                                inviter_name: data.data.inviter_username,
                                invitee_name: localStorage.getItem("userName"),
                                notification_id: data.notification_id,
                            }];

                        });
                    }
                    else if (data.type === "remove") {
                        handle_removed(data.notification_id);
                        alert("你已被移除出群聊" + data.data.group_name);
                    }
                    else if (data.type === "set_admin") {
                        handle_set_admin(data.notification_id);
                        alert("你已被设置为群聊管理员" + data.data.group_name);
                    }
                };
            });
        };

        connectWebSocketgroup();
    }, [dispatch]);

    const sendFriendResponse = (request_id: string, response: "accept" | "reject") => {
        ws_friend_request = new WebSocket(
            `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${localStorage.getItem("token")}`
        );

        ws_friend_request.onopen = () => {
            console.log("✅ WebSocket 私聊连接已建立");

            ws_friend_request.send(JSON.stringify({ action: "respond_request", request_id, response }));
            const actionMsg = response === "accept" ? "已接受好友请求" : "已拒绝好友请求";
            alert(actionMsg);
            setPendingRequests(prev => prev.filter(r => r.request_id !== request_id));
            //向WebSocket 发送显示已读
            if (ws_friend_request && ws_friend_request.readyState === WebSocket.OPEN) {
                ws_friend_request.send(JSON.stringify({
                    action: "acknowledge",
                    request_id: request_id,
                }));
            }

        };
    };

    const sendGroupResponseReview = (invite_id: string, notification_id: string, response: "approve" | "reject") => {
        const token = localStorage.getItem("token");
        fetch(`${BACKEND_URL}/api/admin-review`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                invite_id: invite_id,
                action: response,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (Number(res.code) === 0) {
                    alert("发送审核结果成功！" + response);
                    console.log(res);
                    console.log(pendingRequestsgroupreview);
                    setPendingRequestsgroupreview(prev => prev.filter(r => r.invite_id !== invite_id));
                    console.log("after")
                    console.log(pendingRequestsgroupreview);
                    ws_group_invite = new WebSocket(
                        `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/notify/?token=${localStorage.getItem("token")}`
                    );
                    setPendingRequestsgroupreview(prev => prev.filter(r => r.invite_id !== invite_id));
                    ws_group_invite.onopen = () => {
                        console.log("readytosend")
                        console.log(notification_id)
                        ws_group_invite.send(JSON.stringify({
                            action: "acknowledge",
                            notification_id: notification_id,
                        }));
                    };

                }
                else {
                    console.log("发送审核结果失败", res);
                }
            })
    };

    const sendGroupResponseInvitee = (invite_id: string, notification_id: string, response: "accept" | "decline") => {
        const token = localStorage.getItem("token");
        fetch(`${BACKEND_URL}/api/respond-invite`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                invite_id: invite_id,
                action: response,
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (Number(res.code) === 0) {
                    alert("响应邀请成功" + response);
                    setPendingRequestsgroupinvitee(prev => prev.filter(r => r.invite_id !== invite_id));
                    ws_group_invite = new WebSocket(
                        `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/notify/?token=${localStorage.getItem("token")}`
                    );
                    setPendingRequestsgroupreview(prev => prev.filter(r => r.invite_id !== invite_id));
                    ws_group_invite.onopen = () => {
                        console.log(notification_id)
                        ws_group_invite.send(JSON.stringify({
                            action: "acknowledge",
                            notification_id: notification_id,
                        }));
                    };

                }
                else {
                    console.log("发送审核结果失败", res);
                }
            })
    };

    const handleAccept = (request_id: string) => sendFriendResponse(request_id, "accept");
    const handleReject = (request_id: string) => sendFriendResponse(request_id, "reject");

    const handleAcceptgroupReview = (invite_id: string, notification_id: string) => { sendGroupResponseReview(invite_id, notification_id, "approve") };
    const handleDeclinegroupReview = (invite_id: string, notification_id: string) => { sendGroupResponseReview(invite_id, notification_id, "reject") };


    const handleAcceptgroupInvitee = (invite_id: string, notification_id: string) => { sendGroupResponseInvitee(invite_id, notification_id, "accept") };
    const handleDeclinegroupInvitee = (invite_id: string, notification_id: string) => { sendGroupResponseInvitee(invite_id, notification_id, "decline") };

    const handle_removed = (notification_id: string) => {
        ws_group_invite = new WebSocket(
            `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/notify/?token=${localStorage.getItem("token")}`
        );
        ws_group_invite.onopen = () => {
            console.log(notification_id)
            ws_group_invite.send(JSON.stringify({
                action: "acknowledge",
                notification_id: notification_id,
            }));
        }
    }
    const handle_set_admin = (notification_id: string) => {
        ws_group_invite = new WebSocket(
            `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/notify/?token=${localStorage.getItem("token")}`
        );
        ws_group_invite.onopen = () => {
            console.log(notification_id)
            ws_group_invite.send(JSON.stringify({
                action: "acknowledge",
                notification_id: notification_id,
            }));
        }
    }
    return (
        <Flex vertical gap="middle" style={{ padding: 24 }}>

            {pendingRequests.length > 0 && (
                <div
                    style={{
                        background: "#fffbe6",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #ffe58f",
                    }}
                >
                    <Title level={4}>待处理好友请求</Title>
                    <List
                        dataSource={pendingRequests}
                        renderItem={(request) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="accept"
                                        type="link"
                                        onClick={() => handleAccept(request.request_id)}
                                    >
                                        接受
                                    </Button>,
                                    <Button
                                        key="reject"
                                        type="link"
                                        danger
                                        onClick={() => handleReject(request.request_id)}
                                    >
                                        拒绝
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={request.sender_name}
                                    description={`请求加你为好友（类型：${request.request_type}）`}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )}
            {pendingRequestsgroupreview.length > 0 && (
                <div
                    style={{
                        background: "#fffbe6",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #ffe58f",
                    }}
                >
                    <Title level={4}>待处理群审核</Title>
                    <List
                        dataSource={pendingRequestsgroupreview}
                        renderItem={(request) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="approve"
                                        type="link"
                                        onClick={() => handleAcceptgroupReview(request.invite_id, request.notification_id)}
                                    >
                                        接受
                                    </Button>,
                                    <Button
                                        key="reject"
                                        type="link"
                                        danger
                                        onClick={() => handleDeclinegroupReview(request.invite_id, request.notification_id)}
                                    >
                                        拒绝
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={request.group_name}
                                    description={`${request.inviter_name}邀请${request.invitee_name}加入群聊 ${request.group_name}`}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )}

            {pendingRequestsgroupinvitee.length > 0 && (
                <div
                    style={{
                        background: "#fffbe6",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #ffe58f",
                    }}
                >
                    <Title level={4}>待处理进群邀请</Title>
                    <List
                        dataSource={pendingRequestsgroupinvitee}
                        renderItem={(request) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="accept"
                                        type="link"
                                        onClick={() => handleAcceptgroupInvitee(request.invite_id, request.notification_id)}
                                    >
                                        接受
                                    </Button>,
                                    <Button
                                        key="decline"
                                        type="link"
                                        danger
                                        onClick={() => handleDeclinegroupInvitee(request.invite_id, request.notification_id)}
                                    >
                                        拒绝
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={request.group_name}
                                    description={`${request.inviter_name}邀请${request.invitee_name}加入群聊 ${request.group_name}`}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )}
        </Flex>
    );
};

export default Page;
