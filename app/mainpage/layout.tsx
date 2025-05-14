'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu } from 'antd';
import {
    MessageOutlined,
    SettingOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;

// 将当前路径映射为导航栏选中的 key
const getSelectedKey = (pathname: string): string => {
    if (pathname.startsWith('/mainpage/chat')) return 'chat';
    if (pathname.startsWith('/mainpage/friends')) return 'friends';
    if (
        pathname.startsWith('/mainpage/profile') ||
        pathname.startsWith('/mainpage/editProfile')
    )
        return 'editProfile';
    return 'chat'; // 默认
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login'); // 未登录跳转回登录页
        }
    }, []);

    const selectedKey = getSelectedKey(pathname);

    // 图标样式统一设置为大一点 + 紫色
    const iconStyle: React.CSSProperties = {
        fontSize: '24px',
        color: 'purple',
    };

    return (
        <Layout style={{ maxHeight: '80vh', padding: '0 20px' }}>
            {/* 左侧导航栏 */}
            <Sider width={80} theme="light" style={{ paddingTop: 20 }}>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={({ key }) => router.push(`/mainpage/${key}`)}
                    style={{ borderRight: 0 }}
                >
                    <Menu.Item
                        key="chat"
                        icon={<MessageOutlined style={iconStyle} />}
                        style={{ height: '60px', lineHeight: '60px' }}
                    />
                    <Menu.Item 
                        key="friends" 
                        icon={<UsergroupAddOutlined style={iconStyle} />}
                        style={{ height: '60px', lineHeight: '60px' }}
                    />
                    <Menu.Item 
                        key="editProfile" 
                        icon={<SettingOutlined style={iconStyle} />}
                        style={{ height: '60px', lineHeight: '60px' }} 
                    />
                </Menu>
            </Sider>

            {/* 右侧页面内容 */}
            <Layout>
                <Content style={{ padding: '16px', backgroundColor: '#fff' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
