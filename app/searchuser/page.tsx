'use client';

import React, { useState } from 'react';
import { Input, List, Avatar, Button, Space, message } from 'antd';
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setName, setToken } from "../redux/auth";
import type { GetProps } from 'antd';
import store, { RootState } from "../redux/store";
import { BACKEND_URL, FAILURE_PREFIX, LOGIN_FAILED, LOGIN_SUCCESS_PREFIX,REGISTER_FAILED,REGISTER_SUCCESS_PREFIX,REGISTER_REQUIRED} from "../constants/string";
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
    // 组件加载时从 localStorage 获取 token 并恢复 Redux 状态
    useEffect(() => {
      const storedToken = localStorage.getItem("token");
      const storedUserName = localStorage.getItem("userName");
  
      if (storedToken) {
        dispatch(setToken(storedToken));
      }
      if (storedUserName) {
        dispatch(setName(storedUserName));
      }
    }, [dispatch]);

  const onSearch: SearchProps['onSearch'] = async (value) => {
    if (!value) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/search?query=${encodeURIComponent(value)}`,
        {
          headers: {
            'Authorization': `${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.friends) {
        setResults(data.friends);
      } else {
        message.error('没有搜索结果');
        setResults([]);
      }
    } catch (err) {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (item: Friend) =>  {

  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Search
        placeholder="搜索用户名"
        onSearch={onSearch}
        enterButton="Search"
        loading={loading}
        allowClear
      />
      <List
        itemLayout="horizontal"
        dataSource={results}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.is_friend ? (
                <Button type="default" disabled>
                  已添加
                </Button>
              ) : (
                <Button type="primary" onClick={() => addFriend(item)}>添加好友</Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={item.avatar} />}
              title={item.userName}
              description={item.is_friend ? '已是好友' : '未添加'}
            />
          </List.Item>
        )}
      />
    </Space>
  );
};

export default SearchUserPage;