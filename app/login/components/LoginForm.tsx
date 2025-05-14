"use client";

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { ProFormText } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setName, setToken } from '../../redux/auth';
import { BACKEND_URL, LOGIN_FAILED, LOGIN_SUCCESS_PREFIX, FAILURE_PREFIX } from '../../constants/string';

const LoginForm = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const dispatch = useDispatch();

    const login = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, password }),
            });
            const res = await response.json();

            if (res.code === 0) {
                dispatch(setToken(res.token));
                dispatch(setName(userName));
                localStorage.setItem('token', res.token);
                localStorage.setItem('userName', userName);
                alert(LOGIN_SUCCESS_PREFIX + userName);
                router.push('/mainpage/chat');
            } else {
                alert(LOGIN_FAILED);
            }
        } catch (err) {
            alert(FAILURE_PREFIX + err);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '400px' }}>
            <ProFormText
                name="username"
                fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                    value: userName,
                    onChange: (e) => setUserName(e.target.value),
                }}
                placeholder="  用户名"
                rules={[{ required: true, message: '请输入用户名!' }]}
            />
            <ProFormText.Password
                name="password"
                fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined />,
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                }}
                placeholder="  密码"
                rules={[{ required: true, message: '请输入密码！' }]}
            />
            <Button
                type="primary"
                block
                size="large"
                style={{
                    marginTop: '20px',
                    backgroundColor: '#722ed1', // 设置按钮背景色为紫色
                    borderColor: '#722ed1',    // 设置按钮边框色为紫色
                }}
                onClick={login}
            >
                登录
            </Button>
        </div>
    );
};

export default LoginForm;