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
    name: yup.string().required("Name est requis"),
    city: yup.string().required("City est requis"),
    description: yup.string().required("Description est requise"),
});

const CreateNetwork = () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const router = useRouter();
    const toast = useRef(null);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchCities = async () => {
        try {
            const response = await axios.get('/cities/', {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            setCities(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des villes', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des villes', life: 3000 });
        }
    };

    const onSubmitForm = async (data) => {
        console.log("test test");
        data['city'] = selectedCity;
        try {
            await axios.post('/networks/create/', data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Réseau créé avec succès', life: 3000 });
            // Redirection vers la liste des réseaux après le succès de la création
            setTimeout(() => router.push('/admin/networks/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la création du réseau', error);
            if (error?.response?.status === 401 && error?.response?.data?.error === 'Unauthorized') {
                toast.current.show({ severity: 'error', summary: 'Non !!', detail: 'Vous n\'avez pas l\'autorisation de créer un réseau.', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création du réseau', life: 3000 });
            }
        }
    };

    useEffect(() => {
        fetchCities();
        if (!(userHasPermitTo(permissions, 37) || profile.is_superuser)) {  // Assurez-vous d'avoir la bonne permission ID
            setShowNotPermitViewModal(true);
        }
    }, [permissions, profile]);

    return (
        <div>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Ajout d'un Réseau :</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations du nouveau réseau</h2>
                <form onSubmit={handleSubmit(onSubmitForm)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <InputText id="name" {...register('name')} placeholder="Name..." className={styles.input} />
                        {errors.name && <small className={styles.error}>{errors.name.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Dropdown id="city" {...register('city')} value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value) }} placeholder="City..." options={cities} optionLabel="label" optionValue="id" className={styles.input} />
                        {errors.city && <small className={styles.error}>{errors.city.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputTextarea id="description" {...register('description')} placeholder="Description du réseau..." className={styles.textarea} />
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

export default CreateNetwork;
