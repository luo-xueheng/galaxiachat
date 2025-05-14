import React from 'react';
import SearchList from './SearchListWrapper'; // 我们稍后会创建这个组件，用来复用你之前的 chatList 页面

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* 左侧：会话列表 */}
            <div style={{ width: 500, borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
                <SearchList />
            </div>

            {/* 右侧：聊天详情 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </div>
        </div>
    );
}