import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: null,
        profile: null,
        permissions: null
    },
    reducers: {
        setAuth: (state, action) => {
            state.token = action.payload.token;
            state.profile = action.payload.profile;
            state.permissions = action.payload.permissions;
        },
        clearAuth: (state) => {
            state.token = null;
            state.profile = null;
            state.permissions = null;
        },
    },
});

export const { setAuth, clearAuth } = authSlice.actions;

export default authSlice.reducer;
