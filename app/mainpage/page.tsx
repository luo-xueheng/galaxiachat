"use client";
import { Button, Flex, List, Avatar, Collapse, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { setName, setToken } from "../redux/auth";
import { RootState } from "../redux/store";
import { BACKEND_URL, FAILURE_PREFIX, LOGOUT_SUCCESS, LOGOUT_FAILED } from "../constants/string";

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

const Page = () => {
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const dispatch = useDispatch();

  const [groups, setGroups] = useState<Group[]>([]); // Initialize as empty array
  const [uncategorized, setUncategorized] = useState<Friend[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");

    if (storedToken) dispatch(setToken(storedToken));
    if (storedUserName) dispatch(setName(storedUserName));
  }, [dispatch]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/user/friends`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      const data = await res.json();
      if (data.code === 0) {
        setGroups(data.groups || []); // Ensure groups is always an array
        setUncategorized(data.uncategorized || []); // Ensure uncategorized is always an array
      } else {
        message.error("获取好友列表失败：" + data.message);
      }
    } catch (err) {
      message.error("请求好友列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  const logout = async () => {
    try {
      if (!token) {
        console.error("No JWT token found");
        return;
      }

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

  const renderFriendList = (friends: Friend[]) => (
    <List
      itemLayout="horizontal"
      dataSource={friends}
      renderItem={(friend) => (
        <List.Item>
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
      <Title level={3}>好友列表</Title>
      <Button onClick={fetchFriends} loading={loading}>
        刷新好友列表
      </Button>
      <Collapse defaultActiveKey={['uncategorized', ...(groups?.map((g) => g.id) || [])]}>
        <Panel header="未分组" key="uncategorized">
          {renderFriendList(uncategorized)}
        </Panel>
        {groups.map((group) => (
          <Panel header={group.name} key={group.id}>
            {renderFriendList(group.users)}
          </Panel>
        ))}
      </Collapse>
    </Flex>
  );
};

export default Page;