    import { configureStore } from '@reduxjs/toolkit';
    import { persistStore, persistReducer } from 'redux-persist';
    import storage from 'redux-persist/lib/storage';
    import authReducer from './slices/authSlice';
    import { combineReducers } from 'redux';

    // Configuration de persistance
    const persistConfig = {
        key: 'root',
        storage,
    };

    const rootReducer = combineReducers({
        auth: persistReducer(persistConfig, authReducer),
    });

    const store = configureStore({
        reducer: rootReducer,
    });

    const persistor = persistStore(store);

    export { store, persistor };
