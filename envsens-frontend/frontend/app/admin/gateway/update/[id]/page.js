"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '@/app/axiosConfig';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { useParams, useRouter } from 'next/navigation';
import styles from './create.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    description: yup.string().required("Description est requise"),
    network: yup.string().required("Network est requis"),
    location: yup.string().required("Location est requise"),
    location_name: yup.string().required("Location Name est requis"),
    location_description: yup.string().required("Location Description est requise"),
});

const UpdateGateway = () => {
    const {id} = useParams();
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [networks, setNetworks] = useState([]);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [gatewayData, setGatewayData] = useState(null);
    const router = useRouter();
    const toast = useRef(null);
    const { setValue, register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchNetworks = async () => {
        try {
            const response = await axios.get('/networks/', {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            setNetworks(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des réseaux', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des réseaux', life: 3000 });
        }
    };

    const fetchGatewayData = async (gatewayId) => {
        await axios.get(`/admins/gateways/details/${gatewayId}/`, {
            headers: {
                "Authorization": "Bearer " + token.access
            }
        }).then((response) => {
            setGatewayData(response.data);
            Object.keys(response.data).forEach(key => {
                setValue(key, response.data[key]);
            });
        }).catch((err) => {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        });
    };

    const onSubmit = async (data) => {
        data['network'] = selectedNetwork ? selectedNetwork : gatewayData.network;
        try {
            await axios.put(`/admin/gateways/update/${id}/`, data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Gateway mis à jour avec succès', life: 3000 });
            // Redirection vers la liste des gateways après le succès de la mise à jour
            setTimeout(() => router.push('/admin/gateways/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du gateway', error);
            if (error?.response?.status === 401 && error?.response?.data?.error === 'Unauthorized') {
                toast.current.show({ severity: 'error', summary: 'Non !!', detail: 'Vous n\'avez pas l\'autorisation de modifier un gateway.', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour du gateway', life: 3000 });
            }
        }
    };

    useEffect(() => {
        fetchGatewayData(id);
        fetchNetworks();
        if (!(userHasPermitTo(permissions, 66) || profile.is_superuser)) {
            setShowNotPermitViewModal(true);
        }
    }, [permissions, profile, id]);

    return (
        <div>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Mise à jour du Gateway : {gatewayData?.description}</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations du gateway</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    
                    <div className={styles.formGroup}>
                        <Dropdown id="network" {...register('network')} value={selectedNetwork} onChange={(e) => { setSelectedNetwork(e.target.value) }} placeholder="Network..." options={networks} optionLabel="name" optionValue="id" className={styles.input} />
                        {errors.network && <small className={styles.error}>{errors.network.message}</small>}
                    </div>
                    <div className={styles.divflexCol}>
                        <div className={styles.formGroup}>
                            <InputText id="longitude" {...register('longitude')} placeholder="Longitude..." className={styles.input} />
                            {errors.longitude && <small className={styles.error}>{errors.longitude.message}</small>}
                        </div>
                        <div className={styles.formGroup}>
                            <InputText id="latitude" {...register('latitude')} placeholder="Latitude..." className={styles.input} />
                            {errors.latitude && <small className={styles.error}>{errors.latitude.message}</small>}
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="location_name" {...register('location_name')} placeholder="Location Name..." className={styles.input} />
                        {errors.location_name && <small className={styles.error}>{errors.location_name.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputTextarea id="description" {...register('description')} placeholder="Description..." className={styles.textarea} />
                        {errors.description && <small className={styles.error}>{errors.description.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputTextarea id="location_description" {...register('location_description')} placeholder="Location Description..." className={styles.textarea} />
                        {errors.location_description && <small className={styles.error}>{errors.location_description.message}</small>}
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

export default UpdateGateway;
