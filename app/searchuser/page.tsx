'use client';

import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Space, message, Empty } from 'antd';
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

const { Search } = Input;

const SearchUserPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Friend[]>([]);
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const dispatch = useDispatch();

  // 初始化：恢复 token 和用户名
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
      console.log("搜索结果返回：", data);

      // ✅ 注意这里根据你后端返回的是 users，不是 friends
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

  const addFriend = async (item: Friend) => {
    message.info(`尝试添加好友：${item.userName}`);
    // 这里可以集成 WebSocket 或请求
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
                item.is_friend ? (
                  <Button type="default" disabled>
                    已添加
                  </Button>
                ) : (
                  <Button type="primary" onClick={() => addFriend(item)}>
                    添加好友
                  </Button>
                ),
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
