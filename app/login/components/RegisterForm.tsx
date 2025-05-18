"use client";

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { ProFormText } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setName, setToken } from '../../redux/auth';
import { BACKEND_URL, REGISTER_FAILED, REGISTER_SUCCESS_PREFIX, FAILURE_PREFIX } from '../../constants/string';

const RegisterForm = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [nickName, setNickName] = useState('');
    const router = useRouter();
    const dispatch = useDispatch();

    const register = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, password, email, phone, nickName }),
            });
            const res = await response.json();

            if (res.code === 0) {
                dispatch(setToken(res.token));
                dispatch(setName(userName));
                localStorage.setItem('token', res.token);
                localStorage.setItem('userName', userName);
                alert(REGISTER_SUCCESS_PREFIX + userName);
                router.push('/mainpage/chat');
            } else {
                // if (res.code === 3) {
                //     alert("注册失败，用户名已存在！");
                // }
                if (res.info == 1062) {
                    if (res.code.includes("instant_msg_user.email")) alert("注册失败!email已存在！");
                    else if (res.code.includes("instant_msg_user.phone")) alert("注册失败!phone已存在！");
                }
                else alert(REGISTER_FAILED + "!" + res.info);
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
                placeholder="用户名"
                rules={[{ required: true, message: '请输入用户名!' }]}
            />
            <ProFormText
                name="nickname"
                fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                    value: nickName,
                    onChange: (e) => setNickName(e.target.value),
                }}
                placeholder="昵称"
                rules={[{ required: true, message: '请输入昵称!' }]}
            />
            <ProFormText.Password
                name="password"
                fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined />,
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                }}
                placeholder="密码"
                rules={[{ required: true, message: '请输入密码！' }]}
            />
            <ProFormText
                name="email"
                fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                }}
                placeholder="邮箱"
                rules={[{ required: true, message: '请输入邮箱!' }]}
            />
            <ProFormText
                name="phone"
                fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                    value: phone,
                    onChange: (e) => setPhone(e.target.value),
                }}
                placeholder="电话号码"
                rules={[{ required: true, message: '请输入电话号码!' }]}
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
                onClick={register}
            >
                注册
            </Button>
        </div>
    );
};

export default RegisterForm;