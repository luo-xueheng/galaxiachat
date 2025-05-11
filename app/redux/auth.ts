import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    token: string;
    name: string;
    password: string;
    email: string;
    phone: string;
    avatar: string;
}

const initialState: AuthState = {
    token: "",
    name: "",
    password: "",
    email: "",
    phone: "",
    avatar: "",
};

/**
 * @todo [Step 4] 请在下述一处代码缺失部分以正确设置 JWT 信息
 */
export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string>) => {
            // Step 4 BEGIN
            state.token = action.payload
            // Step 4 END
        },
        setName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setPassword: (state, action: PayloadAction<string>) => {
            state.password = action.payload;
        },
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setPhone: (state, action: PayloadAction<string>) => {
            state.phone = action.payload;
        },
        setAvatar: (state, action: PayloadAction<string>) => {
            state.avatar = action.payload;
        },
        resetAuth: (state) => {
            state.token = "";
            state.name = "";
            state.password= "";
            state.email = "";
            state.phone = "";
            state.avatar = "";
        },
    },
});

export const { setToken, setName, setPassword , setEmail, setPhone, resetAuth, setAvatar } = authSlice.actions;
export default authSlice.reducer;
