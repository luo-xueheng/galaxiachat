'use client';

import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Card,
    Col,
    Descriptions,
    Form,
    Input,
    Row,
    Button,
    message,
    Divider,
    Typography,
    Space,
    Spin,
} from 'antd';

const { Title, Text } = Typography;

interface UserProfile {
    avatar: string;
    userName: string;
    nickName: string | null;
    email: string;
    phone: string;
}

export default function ProfilePage() {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [editingSensitive, setEditingSensitive] = useState(false);
    const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userName = localStorage.getItem('userName');
                const token = localStorage.getItem('token');

                if (!userName || !token) {
                    message.error('未登录或 token 缺失');
                    return;
                }

                const res = await fetch(`/api/user_profile/?userName=${userName}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (data.code === 0) {
                    const user: UserProfile = {
                        userName: data.name,
                        nickName: data.nickname,
                        email: data.email,
                        phone: data.phone,
                        avatar: data.avatar,
                    };
                    setUserInfo(user);
                    form.setFieldsValue({ nickName: user.nickName });
                } else {
                    message.error('获取用户信息失败：' + data.info);
                }
            } catch (err) {
                console.error(err);
                message.error('网络错误，无法获取用户信息');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleBasicFinish = (values: any) => {
        console.log('提交基本信息：', values);
        message.success('个人信息更新成功');
    };

    const handleSensitiveFinish = (values: any) => {
        console.log('验证旧密码并修改：', values);
        message.success('邮箱和手机号已更新');
    };

    const handlePasswordChange = (values: any) => {
        console.log('修改密码：', values);
        message.success('密码修改成功');
        passwordForm.resetFields();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', paddingTop: 100 }}>
                <Spin size="large" tip="加载用户信息中..." />
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div style={{ textAlign: 'center', paddingTop: 100 }}>
                <Text type="danger">无法加载用户信息，请稍后重试。</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>个人信息</Title>
            <Row gutter={24}>
                {/* 左侧展示信息 */}
                <Col span={8}>
                    <Card>
                        <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <Avatar src={userInfo.avatar} size={120} />
                            <Title level={4} style={{ marginTop: 16 }}>
                                {userInfo.userName}
                            </Title>
                            
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="用户名">{userInfo.userName}</Descriptions.Item>
                                <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
                                <Descriptions.Item label="手机号">{userInfo.phone}</Descriptions.Item>
                            </Descriptions>
                        </Space>
                    </Card>
                </Col>

                <Col span={16}>
                    <Card title="基本信息设置">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="用户名">{userInfo.userName}</Descriptions.Item>
                            <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
                            <Descriptions.Item label="手机号">{userInfo.phone}</Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <Form layout="vertical" form={form} onFinish={handleBasicFinish}>
                            <Form.Item label="昵称" name="nickName">
                                <Input placeholder="请输入昵称" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">保存昵称</Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Divider />

                    <Card title="敏感信息修改">
                        {editingSensitive ? (
                            <Form layout="vertical" onFinish={handleSensitiveFinish}>
                                <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item label="新邮箱" name="newEmail" rules={[{ type: 'email', required: true }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="新手机号" name="newPhone" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item>
                                    <Space>
                                        <Button type="primary" htmlType="submit">保存</Button>
                                        <Button onClick={() => setEditingSensitive(false)}>取消</Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        ) : (
                            <Button onClick={() => setEditingSensitive(true)}>修改邮箱和手机号</Button>
                        )}
                    </Card>

                    <Divider />

                    <Card title="修改密码">
                        <Form layout="vertical" form={passwordForm} onFinish={handlePasswordChange}>
                            <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label="确认新密码" name="confirmNewPassword" dependencies={["newPassword"]} rules={[
                                { required: true, message: '请确认新密码' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不一致'));
                                    },
                                }),
                            ]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">修改密码</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}