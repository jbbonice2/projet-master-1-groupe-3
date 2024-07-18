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
import { useRouter, useParams } from 'next/navigation';
import styles from './create.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    address: yup.string().required("Address est requis"),
    description: yup.string().required("Description est requise"),
    location_name: yup.string().required("Location Name est requis"),
    location_description: yup.string().required("Location Description est requise"),
    longitude: yup.number().required("Longitude est requise"),
    latitude: yup.number().required("Latitude est requise"),
    network_session_key: yup.string().required("Network Session Key est requis"),
    application_session_key: yup.string().required("Application Session Key est requis"),
    is_mobile: yup.string(),
    network: yup.string(),
    gateway: yup.string(),
    dev_id: yup.string().required("Device ID est requis"),
});

const UpdateDevice = () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [networks, setNetworks] = useState([]);
    const [gateways, setGateways] = useState([]);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [selectedGateway, setSelectedGateway] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const { id } = useParams();
    const toast = useRef(null);
    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(schema)
    });

    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchDevice = async (id) => {
        try {
            const response = await axios.get(`/devices/details/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            const device = response.data;
            setValue('address', device.address);
            setValue('description', device.description);
            setValue('location_name', device.location_name);
            setValue('location_description', device.location_description);
            setValue('longitude', device.longitude_read);
            setValue('latitude', device.latitude_read);
            setValue('network_session_key', device.network_session_key);
            setValue('application_session_key', device.application_session_key);
            setValue('is_mobile', device.is_mobile);
            setValue('network', device.network);
            setValue('gateway', device.geteway);
            setValue('dev_id', device.dev_id);
            setSelectedNetwork(device.network);
            setSelectedGateway(device.geteway);
            setIsMobile(device.is_mobile);
        } catch (error) {
            console.error('Erreur lors de la récupération du device', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération du device', life: 3000 });
        }
    };

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

    const fetchGateways = async (networkId) => {
        try {
            const response = await axios.get(`/network/${networkId}/gateways/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            setGateways(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des passerelles', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des passerelles', life: 3000 });
        }
    };

    const onSubmitForm = async (data) => {
        data['is_mobile'] = isMobile === "Yes" ? true : false;
        data['network'] = selectedNetwork;
        data['geteway'] = selectedGateway;
        try {
            await axios.put(`/devices/update/${id}/`, data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Device mis à jour avec succès', life: 3000 });
            // Redirection vers la liste des devices après le succès de la mise à jour
            setTimeout(() => router.push('/admin/devices/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du device', error);
            if (error?.response?.status === 401 && error?.response?.data?.error === 'Unauthorized') {
                toast.current.show({ severity: 'error', summary: 'Non !!', detail: 'Vous n\'avez pas l\'autorisation de mettre à jour ce device.', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour du device', life: 3000 });
            }
        }
    };

    useEffect(() => {
        fetchDevice(id);
        fetchNetworks();
        if (!(userHasPermitTo(permissions, 56) || profile.is_superuser)) {  // Assurez-vous d'avoir la bonne permission ID
            setShowNotPermitViewModal(true);
        }
    }, [id, permissions, profile]);

    useEffect(() => {
        if (selectedNetwork) {
            fetchGateways(selectedNetwork);
        }
    }, [selectedNetwork]);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Mise à jour d'un Device :</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations du device à mettre à jour</h2>
                <form onSubmit={handleSubmit(onSubmitForm)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <InputText id="address" {...register('address')} placeholder="Address..." className={styles.input} />
                        {errors.address && <small className={styles.error}>{errors.address.message}</small>}
                    </div>
                    
                    <div className={styles.formGroup}>
                        <InputText id="location_name" {...register('location_name')} placeholder="Location Name..." className={styles.input} />
                        {errors.location_name && <small className={styles.error}>{errors.location_name.message}</small>}
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
                        <InputText id="network_session_key" {...register('network_session_key')} placeholder="Network Session Key..." className={styles.input} />
                        {errors.network_session_key && <small className={styles.error}>{errors.network_session_key.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="application_session_key" {...register('application_session_key')} placeholder="Application Session Key..." className={styles.input} />
                        {errors.application_session_key && <small className={styles.error}>{errors.application_session_key.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Dropdown id="is_mobile" {...register('is_mobile')} value={isMobile} onChange={(e) => { setIsMobile(e.target.value); }} placeholder="Is Mobile..." options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} optionLabel="label" optionValue="value" className={styles.input} />
                        {errors.is_mobile && <small className={styles.error}>{errors.is_mobile.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Dropdown id="network" {...register('network')} value={selectedNetwork} onChange={(e) => { setSelectedNetwork(e.target.value); setValue('network', e.target.value); }} placeholder="Network..." options={networks} optionLabel="name" optionValue="id" className={styles.input} />
                        {errors.network && <small className={styles.error}>{errors.network.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Dropdown id="gateway" {...register('geteway')} value={selectedGateway} onChange={(e) => { setSelectedGateway(e.target.value); setValue('geteway', e.target.value); }} placeholder="Gateway..." options={gateways} optionLabel="description" optionValue="id" className={styles.input} />
                        {errors.gateway && <small className={styles.error}>{errors.gateway.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="dev_id" {...register('dev_id')} placeholder="Device ID..." className={styles.input} />
                        {errors.dev_id && <small className={styles.error}>{errors.dev_id.message}</small>}
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

export default UpdateDevice;
