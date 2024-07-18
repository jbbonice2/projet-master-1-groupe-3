import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '../../axiosConfig';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import styles from './create.module.css'; // Assurez-vous de créer ce fichier pour les styles spécifiques
import { FaChevronRight } from 'react-icons/fa';
import { useRouter } from 'next/router';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    nom: yup.string().required("Nom est requis"),
    prenom: yup.string().required("Prenom est requis"),
    username: yup.string()
        .required("Nom d'utilisateur est requis")
        .matches(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne doit pas contenir d'espace ni de caractères spéciaux"),
    password: yup.string()
        .required("Mot de passe est requis")
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Les mots de passe doivent correspondre')
        .required('Confirmation du mot de passe est requise'),
});

const CreateUser = () => {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        try {
            await axios.post('/api/users', data);
            // Redirection vers la liste des utilisateurs après le succès de la création
            router.push('/admin/users/list');
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur', error);
            // Gérer l'erreur, afficher un message, etc.
        }
    };

    return (
        <div className={styles.container}>
            <p className={styles.p}><FaChevronRight /> Ajout de l'utilisateur:</p>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <h2 className={styles.h2}>Veuillez entrer ses informations</h2>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <InputText id="nom" {...register('nom')} className={styles.input} />
                        <label htmlFor="nom">Nom ..</label>
                    </span>
                    {errors.nom && <small className="p-error">{errors.nom.message}</small>}
                </div>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <InputText id="prenom" {...register('prenom')} className={styles.input} />
                        <label htmlFor="prenom">Prenom ..</label>
                    </span>
                    {errors.prenom && <small className="p-error">{errors.prenom.message}</small>}
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
                        <Password id="password" {...register('password')} className={styles.input} feedback={false} />
                        <label htmlFor="password">Mot de passe ..</label>
                    </span>
                    {errors.password && <small className="p-error">{errors.password.message}</small>}
                </div>
                <div className={styles.formGroup}>
                    <span className="p-float-label">
                        <Password id="confirmPassword" {...register('confirmPassword')} className={styles.input} feedback={false} />
                        <label htmlFor="confirmPassword">confirmer le mot de passe ..</label>
                    </span>
                    {errors.confirmPassword && <small className="p-error">{errors.confirmPassword.message}</small>}
                </div>
                <Button type="submit" className={styles.input} style={{ color: "#828282", fontWeight: "bold", fontSize: "15pt" }} label="Enregistrer" />
            </form>
        </div>
    );
};

export default CreateUser;
