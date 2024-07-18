'use client';
import React, { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import axios from '../axiosConfig';
import AuthLayout from '@/app/layouts/AuthLayout';
import { setAuth } from '../redux/slices/authSlice';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import styles from './login.module.css';
import { useRouter } from 'next/navigation';

// Schéma de validation avec Yup
const schema = yup.object().shape({
    username: yup.string()
        .required("Nom d'utilisateur est requis")
        .matches(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne doit pas contenir d'espace ni de caractères spéciaux"),
    password: yup.string()
        .required("Mot de passe est requis")
        .min(4, 'Le mot de passe doit contenir au moins 4 caractères')
        // .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        // .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        // .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

const LoginPage = () => {
    const dispatch = useDispatch();
    const toast = useRef(null);

    const {control,  register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const router  = useRouter()
    const onSubmit = async (data) => {
        try {
            const response = await axios.post('/users/login/', data);
            dispatch(setAuth({
                token: response.data.token,
                permissions: response.data.permissions,
                profile: response.data.profile,
            }));

            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Connexion réussie', life: 3000 });
            // Redirection après connexion réussie
            setTimeout(() => {
                router.push('/admin/');
            }, 3000);

        } catch (error) {
            console.error('Erreur lors de la connexion', error);
            if (error.response) {
                if (error.response.status === 400) {
                    toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Mauvaise requête : un champ est requis', life: 5000 });
                } else if (error.response.status === 401) {
                    toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Informations incorrectes', life: 5000 });
                }
            } else {
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la connexion', life: 5000 });
            }
        }
    };

    return (
        <AuthLayout>
            <Toast ref={toast} />
            <div className={styles.container}>
                <h2 className={styles.title} style={{ marginBottom: '60px' }}>EnvSens Connexion</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <label className={styles.label}>Veuillez entrer vos identifiants</label>
                    <div className={styles.formGroup}>
                        <span className="p-float-label">
                            <InputText 
                                id="username" 
                                {...register('username')} 
                                className={styles.input} 
                                placeholder="Nom d'utilisateur .."
                            />
                            {errors.username && <small className="p-error">{errors.username.message}</small>}
                        </span>
                    </div>
                    <div className={styles.formGroup}>
                        <span className="p-float-label">
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <Password
                                    id="password"
                                    {...field}
                                    className={styles.input1}
                                    feedback={false}
                                    toggleMask
                                />
                            )}
                        />
                            {errors.password && <small className="p-error">{errors.password.message}</small>}
                        </span>
                    </div>
                    <div className={styles.rememberMe}>
                        <input type="checkbox" id="rememberMe" />
                        <label htmlFor="rememberMe">Se souvenir de moi</label>
                    </div>
                    <div className={styles.forgotPassword}>
                        Si vous avez oublié votre mot de passe, <a href="/forgetpassword/">réinitialisez-le</a> ou contactez votre administrateur.
                    </div>
                    <Button type="submit" className={styles.button} label="Connexion" />
                </form>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
