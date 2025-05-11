'use client';
import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
  setAlpha,
} from '@ant-design/pro-components';
import { Space, Tabs, message, theme } from 'antd';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Provider, useSelector, useDispatch } from "react-redux";
import { BACKEND_URL, FAILURE_PREFIX, LOGOUT_SUCCESS,LOGOUT_FAILED,SIGNOUT_SUCCESS,SIGNOUT_FAILED } from "../constants/string";
type signoutType = 'password' | 'email' | 'phone';
import store, { RootState } from "../redux/store";
import { useRouter } from 'next/navigation';
import { setName, setToken } from "../redux/auth";
import { useEffect } from 'react';

export default () => {
  const router = useRouter();
  const dispatch = useDispatch();
  //const { token } = theme.useToken();
  const [signoutType, setsignoutType] = useState<signoutType>('phone');
  const userName = useSelector((state: RootState) => state.auth.name);
  const token = useSelector((state: RootState) => state.auth.token);
  //const [userName, setUseName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const iconStyles: CSSProperties = {
    marginInlineStart: '16px',
    //color: setAlpha(theme.useToken().colorTextBase, 0.2),
    fontSize: '24px',
    verticalAlign: 'middle',
    cursor: 'pointer',
  };
  // 组件加载时从 localStorage 获取 token 并恢复 Redux 状态
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      dispatch(setName(storedUserName));
    }
    if (storedToken) {
      dispatch(setToken(storedToken));
    }
  }, [dispatch]);
  const signoutbypassword = async () => {
    if (!token) {
      console.error("No JWT token found");
      return;
    }
    console.log(token);
    console.log(userName);
      fetch(`${BACKEND_URL}/api/signout`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userName,
            password,
        }),
    })
        .then((res) => res.json())
        .then((res) => {
            if (Number(res.code) === 0) {
                alert(SIGNOUT_SUCCESS + userName);
                /**
                 * @note 这里假定 login 页面不是首页面，大作业中这样写的话需要作分支判断
                 */
                router.push(".");
            }
            else {
                alert(SIGNOUT_FAILED);
            }
        })
        .catch((err) => alert(FAILURE_PREFIX + err));
    };
    const signoutbyemail= async () => {
      fetch(`${BACKEND_URL}/api/signout`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userName,
            email,
        }),
    })
        .then((res) => res.json())
        .then((res) => {
            if (Number(res.code) === 0) {
                alert(SIGNOUT_SUCCESS + userName);
                /**
                 * @note 这里假定 login 页面不是首页面，大作业中这样写的话需要作分支判断
                 */
                router.push(".");
            }
            else {
                alert(SIGNOUT_FAILED);
            }
        })
        .catch((err) => alert(FAILURE_PREFIX + err));
    };
    const signoutbyphone = async () => {
      console.log("token"+token)
      fetch(`${BACKEND_URL}/api/signout`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userName,
            phone,
        }),
    })
        .then((res) => res.json())
        .then((res) => {
            if (Number(res.code) === 0) {
                alert(SIGNOUT_SUCCESS + userName);
                // **清空 Redux 里的 token**
                dispatch(setToken(null));
                dispatch(setName(null));
                
                // **清空 localStorage**
                localStorage.removeItem("token");
                localStorage.removeItem("userName");
                router.push(".");
                }
                else {
                alert(SIGNOUT_FAILED);
                }
        })
        .catch((err) => alert(FAILURE_PREFIX + err));
    };

  return (
    <ProConfigProvider hashed={false}>
      <div>
        <LoginForm
          logo="https://github.githubassets.com/favicons/favicon.png"
          title="Github"
          subTitle="全球最大的代码托管平台"
          submitter={{
            searchConfig: {
              submitText: '注销',
            },
          }}
          onFinish={async (values) => {
            if (signoutType === 'password') {
              setPassword(values.password); // 设置状态（可选）
              await signoutbypassword();
            } else if (signoutType === 'email') {
              setEmail(values.email);
              await signoutbyemail();
            } else if (signoutType === 'phone') {
              setPhone(values.phone);
              await signoutbyphone();
            }
            return true; // 表示提交完成
          }}
        >
          <Tabs
            centered
            activeKey={signoutType}
            onChange={(activeKey) => setsignoutType(activeKey as signoutType)}
          >
            <Tabs.TabPane key={'password'} tab={'通过密码注销'} />
            <Tabs.TabPane key={'email'} tab={'通过邮箱注销'} />
            <Tabs.TabPane key={'phone'} tab={'通过手机注销'} />
          </Tabs>
          {signoutType === 'password' && (
            <>
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                }}
                placeholder={'密码：'}
                rules={[
                  {
                    required: true,
                    message: '请输入密码!',
                  },
                ]}
              />
            </>
          )}
          {signoutType === 'email' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined className={'prefixIcon'} />,
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                }}
                name="email"
                placeholder={'邮箱：'}
                rules={[
                  {
                    required: true,
                    message: '请输入邮箱!',
                  },
                ]}
              />
            </>
          )}
          {signoutType === 'phone' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined className={'prefixIcon'} />,
                  value: phone,
                  onChange: (e) => setPhone(e.target.value),
                }}
                name="phone"
                placeholder={'手机号：'}
                rules={[
                  {
                    required: true,
                    message: '请输入手机号!',
                  },
                ]}
              />
            </>
          )}
          <div
            style={{
              marginBlockEnd: 24,
            }}
          >
          </div>
        </LoginForm>
      </div>
    </ProConfigProvider>
  );
};