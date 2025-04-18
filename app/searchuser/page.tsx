'use client';

import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Space, message, Empty, Popover, Spin } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setName, setToken } from "../redux/auth";
import type { GetProps } from 'antd';
import { RootState } from "../redux/store";
import { BACKEND_URL } from "../constants/string";

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
};

let ws: WebSocket | null = null;
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

const { Search } = Input;

const SearchUserPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Friend[]>([]);
  const [selectedUserInfo, setSelectedUserInfo] = useState<UserInfo | null>(null);
  const [openPopoverUser, setOpenPopoverUser] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");

    if (storedToken) dispatch(setToken(storedToken));
    if (storedUserName) dispatch(setName(storedUserName));
  }, [dispatch]);

  useEffect(() => {
    let socket: WebSocket | null = null;

    const initWebSocket = async () => {
      try {
        console.log("获取申请结果")
        socket = await connectWebSocket();
        socket.onmessage = (event) => {
          console.log(event.data)
          const data = JSON.parse(event.data);
          console.log("📨 收到 WebSocket 消息：", data);

          if (data.action === "respond_request") {
            const { from_user, result } = data;

            if (result === "accepted") {
              message.success(`${from_user} 接受了你的好友请求`);
              setResults(prev =>
                prev.map(user =>
                  user.userName === from_user
                    ? { ...user, is_friend: true, is_requested: false }
                    : user
                )
              );
            } else if (result === "rejected") {
              message.warning(`${from_user} 拒绝了你的好友请求`);
              const updatedPending = getPendingRequests().filter(u => u !== from_user);
              localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(updatedPending));
              setResults(prev =>
                prev.map(user =>
                  user.userName === from_user
                    ? { ...user, is_requested: false }
                    : user
                )
              );
            }
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
  }, []);

  const onSearch: SearchProps['onSearch'] = async (value) => {
    if (!value) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/search?query=${encodeURIComponent(value)}`,
        {
          headers: {
            'Authorization': token,
          },
        }
      );

      const data = await res.json();
      const pendingList = getPendingRequests();

      if (data.users && Array.isArray(data.users)) {
        const merged = data.users.map((user: Friend) => ({
          ...user,
          is_requested: !user.is_friend && pendingList.includes(user.userName),
        }));
        cleanPendingList(data.users); // ✅ 清理本地缓存
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

  const fetchUserInfo = async (username: string) => {
    setInfoLoading(true);
    setSelectedUserInfo(null);
    setOpenPopoverUser(username);

    try {
      const res = await fetch(`${BACKEND_URL}/api/user/${username}`, {
        headers: {
          'Authorization': token,
        },
      });

      if (!res.ok) throw new Error('请求失败');
      const data = await res.json();
      setSelectedUserInfo(data);
    } catch (err) {
      console.error("获取用户信息失败：", err);
      message.error("获取用户信息失败");
      setSelectedUserInfo(null);
    } finally {
      setInfoLoading(false);
    }
  };

  const addFriend = async (item: Friend) => {
    try {
      const socket = await connectWebSocket();

      const request = {
        action: "send_request",
        userName: item.userName,
        request_type: "direct",
      };
      socket.send(JSON.stringify(request));

      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.status === "success") {
            alert(`好友请求已成功发送给 ${item.userName}`);

            const newPendingList = [...getPendingRequests(), item.userName];
            localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(newPendingList));
            setResults(prev => prev.map(user =>
              user.userName === item.userName ? { ...user, is_requested: true } : user
            ));
          } 
          //这里总在莫名触发
          // else {
          //   alert(`发送好友请求失败: ${response.message || '未知错误'}`);
          // }
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

  const getPendingRequests = (): string[] => {
    try {
      const data = localStorage.getItem(PENDING_REQUESTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };
  const cleanPendingList = (users: Friend[]) => {
    const pending = getPendingRequests();
  
    // 找出依然是“未加为好友”但在 pending 列表里的用户
    const stillPending = users
      .filter(user => !user.is_friend && pending.includes(user.userName))
      .map(user => user.userName);
  
    // 只保留这些还在申请中的用户
    localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(stillPending));
  };
  const renderPopoverContent = () => {
    if (infoLoading) return <Spin />;
    if (!selectedUserInfo) return <div>未找到信息</div>;

    return (
      <div>
        <p><strong>用户名:</strong> {selectedUserInfo.userName}</p>
        {selectedUserInfo.email && <p><strong>邮箱:</strong> {selectedUserInfo.email}</p>}
        {selectedUserInfo.phone && <p><strong>电话:</strong> {selectedUserInfo.phone}</p>}
        {selectedUserInfo.createdAt && <p><strong>注册时间:</strong> {selectedUserInfo.createdAt}</p>}
      </div>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%', padding: '24px' }}>
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
                    disabled={item.is_friend || item.is_requested}
                  >
                    {item.is_friend ? "已添加" : item.is_requested ? "已申请" : "添加好友"}
                  </Button>

                  <Popover
                    title="用户信息"
                    trigger="click"
                    open={openPopoverUser === item.userName}
                    onOpenChange={(visible) => {
                      if (visible) fetchUserInfo(item.userName);
                      else setOpenPopoverUser(null);
                    }}
                    content={renderPopoverContent()}
                  >
                    <Button type="default">查看信息</Button>
                  </Popover>
                </Space>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} />}
                title={item.userName}
                description={item.is_friend ? "已是好友" : "未添加"}
              />
            </List.Item>
          )}
        />
      )}
    </Space>
  );
};

export default SearchUserPage;
