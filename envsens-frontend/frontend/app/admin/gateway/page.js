"use client";
import React,{ useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '../../axiosConfig';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown'; // Importer Dropdown de PrimeReact
import { useRouter } from 'next/navigation';
import styles from './create.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    network: yup.string().required("Network est requis"),  // Validation pour le champ network
    gwId: yup.string().required("GwId est requis"),
    description: yup.string().required("Description est requise"),
    longitude: yup.string().required("Longitude est requise"),
    latitude: yup.string().required("Latitude est requise"),
    location_name: yup.string().required("Location Name est requis"),
    location_description: yup.string().required("Location Description est requise"),
});

const CreateGateway = () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [networks, setNetworks] = useState([]); // État pour les networks
    const router = useRouter();
    const toast = useRef(null);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { token, profile, permissions } = useSelector(state => state.auth);

    useEffect(() => {
        // Vérification des permissions
        if(!(userHasPermitTo(permissions, 65) || profile.is_superuser)) {
            setShowNotPermitViewModal(true);
        }
        
        // Récupérer la liste des networks
        const fetchNetworks = async () => {
            try {
                const response = await axios.get('/networks/', {
                    headers: { 'Authorization': `Bearer ${token.access}` }
                });
                setNetworks(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des networks', error);
            }
        };

        fetchNetworks();
    }, [permissions, profile, token.access]);

    const onSubmit = async (data) => {
        data['network'] = selectedNetwork;
        try {
            await axios.post('admins/gateways/create/', data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Gateway créé avec succès', life: 3000 });
            setTimeout(() => router.push('/admin/gateway/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la création du gateway', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création du gateway', life: 3000 });
        }
    };

    return (
        <div>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Ajout d'un Gateway :</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations de la  gateway</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <Dropdown id="network" {...register('network')} options={networks} value={selectedNetwork}  onChange={(e)=>{setSelectedNetwork(e.target.value)}} optionLabel="name" optionValue='id' placeholder="Sélectionnez un network" className={styles.input} />
                        {errors.network && <small className={styles.error}>{errors.network.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="gwId" {...register('gwId')} placeholder="GwId de la gateway .." className={styles.input} />
                        {errors.gwId && <small className={styles.error}>{errors.gwId.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="description" {...register('description')} placeholder="Description de la gateway .." className={styles.input} />
                        {errors.description && <small className={styles.error}>{errors.description.message}</small>}
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
                        <InputText id="location_name" {...register('location_name')} placeholder="Location name de la gateway .." className={styles.input} />
                        {errors.location_name && <small className={styles.error}>{errors.location_name.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="location_description" {...register('location_description')} placeholder="Location description de la gateway .." className={styles.input} />
                        {errors.location_description && <small className={styles.error}>{errors.location_description.message}</small>}
                    </div>
                    <Button type="submit" className={styles.submitButton} label="Enregistrer" />
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

export default CreateGateway;
