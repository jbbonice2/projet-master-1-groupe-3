"use client";
import React, { useEffect, useRef, useState } from 'react';
import axios from '@/app/axiosConfig';
import { Button } from 'primereact/button';
import { useParams, useRouter } from 'next/navigation';
import { FaChevronRight, FaEdit, FaExclamationTriangle } from 'react-icons/fa';
import styles from './detail.module.css';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { useSelector } from 'react-redux';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

// Composant DetailGateway
const DetailGateway = () => {
    const router = useRouter();
    const { id } = useParams();
    const toast = useRef(null);
    const [gatewayData, setGatewayData] = useState(null);
    const [networkData, setNetworkData] = useState(null); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchGatewayData = async (gatewayId) => {
        try {
            const response = await axios.get(`admins/gateways/details/${gatewayId}/`, {
                headers: {
                    "Authorization": `Bearer ${token.access}`
                }
            });
            setGatewayData(response.data);

            // Récupérer les informations du réseau
            if (response.data.network) {
                const networkResponse = await axios.get(`/networks/${response.data.network}/`, {
                    headers: {
                        "Authorization": `Bearer ${token.access}`
                    }
                });
                setNetworkData(networkResponse.data);
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        }
    };

    const handleDeleteGateway = async () => {
        try {
            await axios.delete(`/admins/gateways/delete/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Gateway supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            router.push('/admin/gateway/list');
        } catch (error) {
            console.error('Erreur lors de la suppression du gateway', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de la gateway', life: 5000 });
        }
    };

    useEffect(() => {
        if (id) {
            fetchGatewayData(id);
        } else {
            console.log("Pas d'ID disponible");
        }
        if (!(userHasPermitTo(permissions, 36) || profile.is_superuser)) {
            setShowNotPermitModal(true);
        }
    }, [id]);

    const userHasPermitTo = (permissions, permitId) => {
        return permissions.includes(permitId);
    };

    return (
        <div>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Information du Gateway : {gatewayData?.description}</p>
            </div>
            
            <div className={styles.container}>
                <Toast ref={toast} />
                <TabView>
                    <TabPanel header="Informations du gateway">
                        <div className={styles.cardBody}>
                            <p><strong>Description:</strong> {gatewayData?.description}</p>
                            <p><strong>Réseau:</strong> {networkData?.name}</p> {/* Afficher le nom du réseau */}
                            <p><strong>Location:</strong> Latitude {gatewayData?.latitude_read}, Longitude: {gatewayData?.longitude_read}</p>
                            <p><strong>Location Name:</strong> {gatewayData?.location_name}</p>
                            <p><strong>Location Description:</strong> {gatewayData?.location_description}</p>
                            <div className={styles.create_by}>
                                <p><strong>Créé le:</strong> {new Date(gatewayData?.created_at).toLocaleDateString()}</p>
                                <p><strong>Par:</strong> {gatewayData?.created_by}</p>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
                
                <div className={styles.actions}>
                    
                    <div className={styles.others}>
                    <div className={styles.delete}>
                        <Button 
                            onClick={() => {
                                if ( userHasPermitTo(permissions, 67) || profile.is_superuser) {
                                    setShowDeleteModal(true);
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }}
                            label="Supprimer le gateway" 
                            className={styles.deleteButton} 
                        />
                    </div>
                       
                        <div className={styles.delete}>
                            <Button 
                                onClick={() => {
                                    if (userHasPermitTo(permissions, 66) || userHasPermitTo(permissions, 34) || profile.is_superuser) {
                                        router.push('/admin/gateways/update/' + id);
                                    } else {
                                        setShowNotPermitModal(true);
                                    }
                                }}
                                label={<> <FaEdit /> Editer</>} 
                                className={styles.deleteButton} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <Dialog 
                header="Confirmation de suppression" 
                visible={showDeleteModal} 
                style={{ width: '30vw' }} 
                modal 
                footer={
                    <div className='btn_div'>
                        <Button 
                            className={styles.actionButton} 
                            label="Annuler" 
                            icon="pi pi-times" 
                            onClick={() => setShowDeleteModal(false)} 
                        />
                        <Button 
                            className={styles.actionButton} 
                            label="Supprimer" 
                            icon="pi pi-check" 
                            onClick={handleDeleteGateway} 
                            autoFocus 
                        />
                    </div>
                } 
                onHide={() => setShowDeleteModal(false)}
            >
                <p>Veuillez confirmer la suppression de ce gateway !</p>
            </Dialog>
            
            <Dialog 
                header={<span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span>} 
                visible={showNotPermitModal} 
                style={{ width: '30vw' }} 
                modal 
                onHide={() => setShowNotPermitModal(false)}
            >
                <p>Vous n'êtes pas autorisé à effectuer cette action !</p>
            </Dialog>

            <Dialog 
                header={<span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span>} 
                visible={showNotPermitViewModal} 
                style={{ width: '30vw' }} 
                modal 
                onHide={() => { setShowNotPermitViewModal(false); router.back(); }}
            >
                <p>Vous n'avez pas accès à cette page !</p>
            </Dialog>
        </div>
    );
};

export default DetailGateway;
