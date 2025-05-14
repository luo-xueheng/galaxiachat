import React from 'react';
import FriendList from './FriendListWrapper';

export default function FriendLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* 左侧：好友列表 */}
            <div style={{ width: 500, borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
                <FriendList />
            </div>

            {/* 右侧：好友详情 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </div>
        </div>
    );
}
