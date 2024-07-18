"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '../../axiosConfig';  // Assurez-vous que ce chemin est correct
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import styles from './create.module.css'; // Assurez-vous de créer ce fichier pour les styles spécifiques
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';  // Utiliser next/navigation
import { useSelector } from 'react-redux';
import userHasPermitTo from '@/app/utils';
import { Dialog } from 'primereact/dialog';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    first_name: yup.string().required("Nom est requis"),
    last_name: yup.string().required("Prenom est requis"),
    username: yup.string()
        .required("Nom d'utilisateur est requis")
        .matches(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne doit pas contenir d'espace ni de caractères spéciaux"),
    password: yup.string()
        .required("Mot de passe est requis")
        .min(4, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    cpassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
        .required('Confirmation du mot de passe est requise'),
});

const CreateUser = () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const router = useRouter();
    const toast = useRef(null);
    const { control, register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const {token, profile, permissions} = useSelector(state => { return state.auth});

    const onSubmit = async (data) => {
        try {
            await axios.post('/users/register/', data,
            {
                headers: {
                    'Authorization':`Bearer ${token.access}`
                }
            }
        );
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur créé avec succès', life: 3000 });
            // Redirection vers la liste des utilisateurs après le succès de la création
            setTimeout(() => router.push('/admin/users/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création de l\'utilisateur', life: 5000 });
        }
    };

    useEffect(()=>{
        if(!(userHasPermitTo(permissions, 1) || profile.is_superuser)) {
            setShowNotPermitViewModal(true);
        }
    }, [permissions, profile, showNotPermitViewModal]);

    return (
        <div>
        <div className={styles.container_header}>
        <p className={styles.titre}><FaChevronRight /> Ajouter un utilisateur: </p>
         </div>
        <div className={styles.container}>
            <Toast ref={toast} />
            
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <h2 className={styles.h2}>Veuillez entrer ses informations</h2>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <InputText id="nom" {...register('first_name')} className={styles.input} />
                        <label htmlFor="nom">Nom ..</label>
                    </span>
                    {errors.first_name && <small className="p-error">{errors.first_name.message}</small>}
                </div>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <InputText id="prenom" {...register('last_name')} className={styles.input} />
                        <label htmlFor="prenom">Prenom ..</label>
                    </span>
                    {errors.last_name && <small className="p-error">{errors.last_name.message}</small>}
                </div>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <InputText id="username" {...register('username')} className={styles.input} />
                        <label htmlFor="username">Nom d'utilisateur ..</label>
                    </span>
                    {errors.username && <small className="p-error">{errors.username.message}</small>}
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
                                    className={styles.input}
                                    feedback={false}
                                    toggleMask
                                />
                            )}
                        />
                        <label htmlFor="password">Mot de passe ..</label>
                    </span>
                    {errors.password && <small className="p-error">{errors.password.message}</small>}
                </div>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <Controller
                            name="cpassword"
                            control={control}
                            render={({ field }) => (
                                <Password
                                    id="confirmPassword"
                                    {...field}
                                    className={styles.input}
                                    feedback={false}
                                    toggleMask
                                />
                            )}
                        />
                        <label htmlFor="confirmPassword">Confirmer le mot de passe ..</label>
                    </span>
                    {errors.cpassword && <small className="p-error">{errors.cpassword.message}</small>}
                </div>
                <Button type="submit" className={styles.input} style={{ color: "#828282", fontWeight: "bold", fontSize: "15pt" }} label="Enregistrer" />
            </form>
        </div>

            <Dialog header={<>
               <span style={{color:"red"}}><FaExclamationTriangle /> Alert</span>
                </>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => {setShowNotPermitViewModal(false); router.back()}}>
                <p>Vous n'avez pas access à cette page !</p>
            </Dialog>
        </div>
    );
};

export default CreateUser;
