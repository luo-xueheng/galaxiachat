export type Friend = {
    userName: string;
    avatar: string;
};

// 群聊邀请部分 BEGIN

// POST /api/send-group-invitation
// suggest url: /api/group/invite
export type GroupInviteRequest = {
    conversation_id: string; // e.g. "123"
    invitee: string;  // e.g. "lxh1"
}
export type GroupInviteResponse = {
    type: "success" | "error";
    message: string; // e.g. "邀请成功" | "不能重复邀请"
}

// POST
// suggest url: /api/group/admin_review_invite
// 管理员确认邀请 
// 这里确认下是一个群管理就行？还是全部群管理
export type GroupAdminReviewInviteRequest = {
    invite_id: string;
    action: "approve" | "reject";
}
export type GroupAdminReviewInviteResponse = {
    type: "success" | "error"; // 应该不会出错？可以直接给 success，但是接口可以都留成这样
    message: string;
}

// POST
// suggest: /api/group/user_review_invite
// 被邀请用户确认邀请
export type GroupUserReviewInviteRequest = {
    invite_id: string;
    action: "approve" | "reject";
}
export type GroupUserReviewInviteResponse = {
    type: "success" | "error"; // 应该不会出错？可以直接给 success，但是接口可以都留成这样
    message: string;
}

// ws 的部分，约定后端向前端推送的消息格式
// 由于 ws 自身无法区分消息类型，所以需要依赖 type 字段来区分
// 一个 ws 对应一个类型
export type WsGroupMessage = {
    // 用户收到群聊邀请，待确认，确认信息通过 http 发送
    type: "GroupUserReviewInvite";
    id: string; // 消息编号，用于 ack
    invite_id: string; // 邀请编号，用于确认
    conversation_name: string; // 群聊名称（方便起见直接返回群聊名称，不用返回 id 然后前端再去查名称）
    inviter: string;
    // 最终显示效果：{inviter} 邀请你加入群聊 {conversation_name} 【接受】/【拒绝】
} | {
    // 管理员收到邀请申请，确认信息通过 http 发送
    type: "GroupAdminReviewInvite"
    id: string; // 消息编号，用于 ack
    invite_id: string; // 邀请编号，用于确认
    conversation_name: string; // 群聊名称（方便起见直接返回群聊名称，不用返回 id 然后前端再去查名称）
    inviter: string;
    invitee: string;
    // 最终显示效果：{inviter} 邀请 {invitee} 加入群聊 {conversation_name} 【接受】/【拒绝】
} | {
    // 用户被移出一个群聊，收到一条提示信息，确认消息
    type: "GroupRemoveMe";
    id: string; // 消息编号，用于 ack
    conversation_name: string; // 被移出的群聊名称
} | {
    type: "ack"; // 由前端发送给后端，表示对应 id 的消息以后不需要再发送
    id: string;
}

// 群聊邀请部分 END