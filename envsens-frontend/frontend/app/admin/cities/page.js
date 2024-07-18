"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '../../axiosConfig';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { useRouter } from 'next/navigation';
import styles from './create.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    label: yup.string().required("Label est requis"),
    code: yup.string().required("Code est requis"),
    country: yup.string().required("Country est requis"),
    description: yup.string().required("Description est requise"),
});

const CreateCity = () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const router = useRouter();
    const toast = useRef(null);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchCountries = async () => {
        try {
            const response = await axios.get('/countries/', {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            setCountries(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des pays', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des pays', life: 3000 });
        }
    };

    const onSubmit = async (data) => {
        data['country'] = selectedCountry;
        try {
            await axios.post('/cities/create/', data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Ville créée avec succès', life: 3000 });
            // Redirection vers la liste des villes après le succès de la création
            setTimeout(() => router.push('/admin/cities/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la création de la ville', error);
            if (error?.response?.status === 401 && error?.response?.data?.error === 'Unauthorized') {
            toast.current.show({ severity: 'error', summary: 'Non !!', detail: 'Vous n\'avez pas l\'autorisation de creer une ville.', life: 3000 });
                
            }else{
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création de la ville', life: 3000 });
            }
        }
    };

    useEffect(() => {
        fetchCountries();
        if (!(userHasPermitTo(permissions, 33) || profile.is_superuser)) {
            setShowNotPermitViewModal(true);
        }
    }, [permissions, profile]);

    return (
        <div>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Ajout d'une Ville :</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations de la nouvelle ville</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <InputText id="label" {...register('label')} placeholder="Label..." className={styles.input} />
                        {errors.label && <small className={styles.error}>{errors.label.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="code" {...register('code')} placeholder="Code..." className={styles.input} />
                        {errors.code && <small className={styles.error}>{errors.code.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Dropdown id="country" {...register('country')} value={selectedCountry}  onChange={(e)=>{setSelectedCountry(e.target.value)}} placeholder="Country..." options={countries} optionLabel="name" optionValue="id" className={styles.input} />
                        {errors.country && <small className={styles.error}>{errors.country.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputTextarea id="description" {...register('description')} placeholder="Description de la ville..." className={styles.textarea} />
                        {errors.description && <small className={styles.error}>{errors.description.message}</small>}
                    </div>
                    <Button type="submit" className={styles.submitButton} label="Enregistrer" />
                </form>
            </div>

            <Dialog header={<><span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span></>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => { setShowNotPermitViewModal(false); router.back() }}>
                <p>Vous n'avez pas accès à cette page !</p>
            </Dialog>
        </div>
    );
};

export default CreateCity;
