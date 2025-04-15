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
};

type UserInfo = {
  userName: string;
  avatar: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  // 你可以根据后端返回字段再补充
};
// 全局WebSocket连接实例
let ws: WebSocket | null = null;
const connectWebSocket = async (): Promise<WebSocket> => {
  const token = localStorage.getItem('token'); // 从 localStorage 获取 token
  if (!token) {
    throw new Error("Token 不存在，无法建立 WebSocket 连接");
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    return ws;
  }

  return new Promise((resolve, reject) => {
    ws = new WebSocket(`wss://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/ws/friend-request/?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket 连接已建立');
      resolve(ws as WebSocket);
    };

    ws.onerror = (error) => {
      console.error('WebSocket 连接错误:', error);
      reject(error);
    };

    ws.onclose = () => {
      console.log('WebSocket 连接已关闭');
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
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");

    if (storedToken) dispatch(setToken(storedToken));
    if (storedUserName) dispatch(setName(storedUserName));
  }, [dispatch]);

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
      if (data.users && Array.isArray(data.users)) {
        setResults(data.users);
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
        username: item.userName,
        request_type: "direct",
      };
  
      socket.send(JSON.stringify(request));
  
      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.status === "success") {
            message.success(`好友请求已成功发送给 ${item.userName}`);
          } else {
            message.error(`发送好友请求失败: ${response.message || '未知错误'}`);
          }
        } catch (e) {
          console.error('解析响应失败:', e);
          message.error('处理服务器响应时出错');
        }
      };
    } catch (error) {
      console.error('添加好友失败:', error);
      message.error('连接服务器失败，请稍后重试');
    }
  };
  
  // 组件卸载时关闭连接
const closeWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
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
                    disabled={item.is_friend}
                  >
                    {item.is_friend ? "已添加" : "添加好友"}
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
