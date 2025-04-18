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

let ws: WebSocket | null = null;

const Page = () => {
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const dispatch = useDispatch();

  const [groups, setGroups] = useState<Group[]>([]);
  const [uncategorized, setUncategorized] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");

    if (storedToken) dispatch(setToken(storedToken));
    if (storedUserName) dispatch(setName(storedUserName));

    const connectWebSocket = async (): Promise<WebSocket> => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token 不存在，无法建立 WebSocket 连接");

      return new Promise((resolve, reject) => {
        ws = new WebSocket(
          `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(token)}`
        );

        ws.onopen = () => {
          console.log("✅ WebSocket 连接已建立");
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error("❌ WebSocket 连接错误:", error);
          reject(error);
        };

        ws.onclose = () => {
          console.warn("⚠️ WebSocket 连接已关闭");
          ws = null;
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "friend_request" && data.sender_name && data.request_id) {
            setPendingRequests((prev) => [
              ...prev,
              {
                request_id: data.request_id,
                sender_name: data.sender_name,
                request_type: data.request_type,
              },
            ]);
          }
        };
      });
    };

    connectWebSocket();
  }, [dispatch]);

  const fetchFriends = async () => {
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
    try {
      const res = await fetch(`${BACKEND_URL}/api/friends/groups`, {
        method: "GET",
      });
      const data = await res.json();
      if (data.code === 0 && Array.isArray(data.groups)) {
        setAvailableGroups(data.groups);  // 更新可用的分组数据
      }
    } catch (err) {
      console.error("获取分组失败", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriends();
      fetchGroupTypes();
    }
  }, [token]);

  const logout = async () => {
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

  const handleAccept = async (request_id: string) => {
    try {
      const socket = new WebSocket(
        `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(token!)}`
      );

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            action: "respond_request",
            request_id,
            response: "accept",
          })
        );
        alert("已接受好友请求");
        setPendingRequests((prev) =>
          prev.filter((r) => r.request_id !== request_id)
        );
      };
    } catch (err) {
      console.error("接受失败", err);
      message.error("操作失败");
    }
  };

  const handleReject = async (request_id: string) => {
    try {
      const socket = new WebSocket(
        `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(token!)}`
      );

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            action: "respond_request",
            request_id,
            response: "reject",
          })
        );
        alert("已拒绝好友请求");
        setPendingRequests((prev) =>
          prev.filter((r) => r.request_id !== request_id)
        );
      };
    } catch (err) {
      console.error("拒绝失败", err);
      message.error("操作失败");
    }
  };

  const handleDelete = async (userNameToDelete: string, groupId?: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `${token}`,
        },
        body: JSON.stringify({ userName: userNameToDelete }),
      });
      const data = await response.json();
      console.log("删除好友返回：",data)
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

  // 渲染好友列表时，提供分组选择功能
const renderFriendList = (friends: Friend[], showGroupOptions = false,groupId?: string) => (
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
      <Flex gap="small">
        <Button type="primary" onClick={logout}>
          logout
        </Button>
        <Button onClick={() => router.push("/signout")}>signout</Button>
        <Button onClick={() => router.push("/searchuser")}>searchuser</Button>
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
