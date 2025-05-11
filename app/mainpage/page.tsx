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
import { setName, setToken } from "../redux/auth";
import { RootState } from "../redux/store";
import {
  BACKEND_URL,
  FAILURE_PREFIX,
  LOGOUT_SUCCESS,
  LOGOUT_FAILED,
} from "../constants/string";
import { WsGroupMessage } from "../api";
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
    if (storedToken) {
      fetchFriends();
      fetchGroupTypes();
    }
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
    if (storedToken) {
      fetchFriends();
      fetchGroupTypes();
    }
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

            // [TODO]
          }
          else if (data.type === "remove") {
            // [TODO]
            handle_removed(data.notification_id);
            alert("你已被移除出群聊" + data.data.group_name);
          }
          else if (data.type === "set_admin") {
            // [TODO]
            handle_set_admin(data.notification_id);
            alert("你已被设置为群聊管理员" + data.data.group_name);
          }
        };
      });
    };

    connectWebSocketgroup();
  }, [dispatch]);

  const logout = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${BACKEND_URL}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName }),
      });

      const data = await response.json();
      if (data.code === 0) {
        alert(LOGOUT_SUCCESS);
        dispatch(setToken(null));
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        router.push(".");
      } else {
        alert(FAILURE_PREFIX + (data.message || LOGOUT_FAILED));
      }
    } catch (error) {
      alert(FAILURE_PREFIX + error);
    }
  };
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
      //自动更新好友列表
      fetchFriends();

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
        router.push(`/chat/${conversationId}?${new URLSearchParams({
          currentChatFriendUserName: friendUserName,
        }).toString()
          }`);
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
            <Button
              key="chat"
              onClick={() => handleCreateConversation(friend.userName)}
            >
              发消息
            </Button>
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
      <Title level={4}>欢迎，{userName} 👋</Title>
      <Flex gap="small">
        <Button type="primary" onClick={logout}>
          logout
        </Button>
        <Button onClick={() => router.push("/signout")}>signout</Button>
        <Button onClick={() => router.push("/searchuser")}>searchuser</Button>
        <Button onClick={() => router.push("/chatList")}>Go to Chat List</Button>
        <Button onClick={() => router.push("/create-groupchat")}>creategroupchat</Button>

        {/* 自动推到最右边 */}
        <div style={{ marginLeft: "auto" }}>
          <Button
            color="purple"
            variant="solid"
            onClick={() => router.push("/editprofile")}
          >
            Edit profile
          </Button>
        </div>

      </Flex>
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

export default Page;
