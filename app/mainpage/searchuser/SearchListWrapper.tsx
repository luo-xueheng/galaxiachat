'use client';

import {
  InfoCircleOutlined
} from '@ant-design/icons';

import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Space, message, Empty, Spin, Typography } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setName, setToken } from "../../redux/auth";
import type { GetProps } from 'antd';
import { RootState } from "../../redux/store";
import { BACKEND_URL } from "../../constants/string";

const { Title } = Typography;

type SearchProps = GetProps<typeof Input.Search>;

type Friend = {
  userName: string;
  avatar: string;
  is_friend: boolean;
  is_requested: boolean;
};
const PENDING_REQUESTS_KEY = 'pendingFriendRequests';
type UserInfo = {
  userName: string;
  avatar: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  is_friend?: boolean;
};

type PendingRequest = {
  userName: string;
  request_id: string;
};

let ws: WebSocket | null = null;


const { Search } = Input;
export default function SearchListPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Friend[]>([]);
  const [selectedUserInfo, setSelectedUserInfo] = useState<UserInfo | null>(null);
  const [openPopoverUser, setOpenPopoverUser] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const router = useRouter();
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const authReady = useSelector((state: RootState) => !!(state.auth.token && state.auth.name));
  const dispatch = useDispatch();

  //监听好友请求的结果，用于更新“添加好友”/“已添加“/“已申请”按钮的状态
  const connectWebSocket = async (): Promise<WebSocket> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("❌ Token 不存在，无法建立 WebSocket 连接");
    }

    return new Promise((resolve, reject) => {
      ws = new WebSocket(
        `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(token)}`
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
  //redirect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("请先登录");
      router.push("/login");
      return;
    }

  }, []);

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
            const { receiver_name, status } = data;

            const updatedPending = getPendingRequests().filter(p => p.userName !== receiver_name);
            setPendingRequests(updatedPending);

            setResults(prev =>
              prev.map(user =>
                user.userName === receiver_name
                  ? { ...user, is_friend: status === "accepted", is_requested: false }
                  : user
              )
            );

            const currentUser = localStorage.getItem("userName");
            const pendingRequestKey = `${PENDING_REQUESTS_KEY}_${currentUser}_${receiver_name}`;
            localStorage.removeItem(pendingRequestKey);

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

  //搜索用户
  const onSearch: SearchProps['onSearch'] = async (value) => {
    if (!value) return;
    setLoading(true);

    try {
      const res = await fetch(`api/users/search?query=${encodeURIComponent(value)}`, {
        headers: {
          'Authorization': token,
        },
      });

      const data = await res.json();
      console.log("🔍 搜索结果：", data);
      const pendingList = getPendingRequests();

      if (data.users && Array.isArray(data.users)) {
        const merged = data.users.map((user: Friend) => ({
          ...user,
          // is_requested: !user.is_friend && pendingList.some(p => p.userName === user.userName),
        }));
        // cleanPendingList(data.users);
        setResults(merged);
      } else {
        message.warning('没有搜索结果');
        setResults([]);
      }
    } catch (err) {
      console.error("搜索请求失败：", err);
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  //点击搜索结果，跳转用户信息界面
  const handleSearchItemClick = async (username: string) => {
    try {
      const response = await fetch(`api/user/${username}`, {
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
      router.push(`/mainpage/searchuser/friendinfo?infoUserName=${username}`);

    } catch (error) {
      console.error('获取用户信息详情失败：', error);
      return null;
    }

  };



  const addFriend = async (item: Friend) => {
    console.log("trying to add friend", item);
    try {
      ws = new WebSocket(
        `wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${encodeURIComponent(token)}`
      );
      ws.onopen = () => {
        console.log('✅ WebSocket 连接已建立');
        ws.send(JSON.stringify({
          action: "send_request",
          userName: item.userName,
          request_type: "direct",
        }));
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log("📤 发送申请响应：", event.data);

          if (response.status === "success") {
            alert(`好友请求已成功发送给 ${item.userName}`);
            const request_id = response.request_id;

            const newPendingList = [...getPendingRequests(), { userName: item.userName, request_id }];
            setPendingRequests(newPendingList);

            setResults(prev =>
              prev.map(user =>
                user.userName === item.userName ? { ...user, is_requested: true } : user
              )
            );
          }
          if (response.status === "error" && response.code === "request_exists") {
            alert(`你已经向 ${item.userName} 发送了好友请求,不要重复发送！`);
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

  const getPendingRequests = (): PendingRequest[] => {
    try {
      const currentUser = localStorage.getItem("userName");
      if (!currentUser) return [];
      const data = localStorage.getItem(`${PENDING_REQUESTS_KEY}_${currentUser}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const setPendingRequests = (requests: PendingRequest[]) => {
    const currentUser = localStorage.getItem("userName");
    if (currentUser) {
      localStorage.setItem(`${PENDING_REQUESTS_KEY}_${currentUser}`, JSON.stringify(requests));
    }
  };

  const cleanPendingList = (users: Friend[]) => {
    const pending = getPendingRequests();
    const stillPending = pending.filter(p =>
      users.some(user => user.userName === p.userName && !user.is_friend)
    );
    setPendingRequests(stillPending);
  };

  const renderPopoverContent = () => {
    if (infoLoading) return <Spin />;
    if (!selectedUserInfo) return <div>未找到信息</div>;

    return (
      <div>
        <p><strong>用户名:</strong> {selectedUserInfo.userName}</p>
        {selectedUserInfo.is_friend && selectedUserInfo.email && (
          <p><strong>邮箱:</strong> {selectedUserInfo.email}</p>
        )}
        {selectedUserInfo.is_friend && selectedUserInfo.phone && (
          <p><strong>电话:</strong> {selectedUserInfo.phone}</p>
        )}
      </div>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%', padding: '24px' }}>
      <Title level={2} style={{ margin: 0 }}>搜索用户</Title>
      <Search
        placeholder="搜索用户名"
        onSearch={onSearch}
        enterButton="Search"
        loading={loading}
        allowClear
      />

      {results.length === 0 ? (
        <Empty description="暂无搜索结果" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={results}
          renderItem={(item) => (
            <List.Item
              key={item.userName}
              actions={[
                <Space key="actions" size="middle">
                  <Button
                    type="primary"
                    onClick={() => addFriend(item)}
                    disabled={item.is_friend}
                  >
                    {item.is_friend ? "已添加" : "添加好友"}
                  </Button>
                </Space>,
              ]}
              onClick={() => handleSearchItemClick(item.userName)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={item.avatar} style={{ marginRight: 12 }} />
                <div>
                  <div style={{ fontSize: 16 }}>{item.userName}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {item.is_friend ? "已是好友" : "未添加"}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />

      )}
    </Space>
  );
};
