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

const DetailDevice = () => {
    const router = useRouter();
    const { id } = useParams();
    const toast = useRef(null);
    const [deviceData, setDeviceData] = useState(null);
    const [gatewayData, setGatewayData] = useState(null);
    const [networkData, setNetworkData] = useState(null); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchDeviceData = async (deviceId) => {
        try {
            const response = await axios.get(`/devices/details/${deviceId}/`, {
                headers: {
                    "Authorization": `Bearer ${token.access}`
                }
            });
            setDeviceData(response.data);
            if (response.data.geteway) {
                const gatewayResponse = await axios.get(`/admins/gateways/details/${response.data.geteway}/`, {
                    headers: {
                        'Authorization': `Bearer ${token.access}`
                    }
                });
                setGatewayData(gatewayResponse.data);
            }
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

    const handleDeleteDevice = async () => {
        try {
            await axios.delete(`/devices/delete/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Appareil supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            router.push('/admin/devices/list');
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'appareil', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de l\'appareil', life: 5000 });
        }
    };

    useEffect(() => {
        if (id) {
            fetchDeviceData(id);
        } else {
            console.log("Pas d'ID disponible");
        }
        if (!(userHasPermitTo(permissions, 54) || profile.is_superuser || deviceData?.created_by === profile.username)) {
            setShowNotPermitModal(true);
        }
    }, [id]);

    return (
        <div>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Informations de l'appareil : {deviceData?.description}</p>
            </div>
            
            <div className={styles.container}>
                <Toast ref={toast} />
                <TabView>
                    <TabPanel header="Informations de l'appareil">
                        <div className={styles.cardBody}>
                            <p><strong>Adresse:  </strong> {deviceData?.address}</p>
                            <p><strong>Description:  </strong> {deviceData?.description}</p>
                            <p><strong>Nom du lieu:  </strong> {deviceData?.location_name}</p>
                            <p><strong>Description du lieu:  </strong> {deviceData?.location_description}</p>
                            <p><strong>Coordonnées:</strong> Latitude: {deviceData?.latitude_read}, Longitude: {deviceData?.longitude_read}</p>
                            <p>
                                <strong>Réseau:   </strong> 
                                <a href={`/admin/networks/${networkData?.id}`} className={styles.link}>
                                    {networkData?.name}
                                </a>
                            </p>
                            <p>
                                <strong>Gateway:  </strong> 
                                <a href={`/admin/gateway/${gatewayData?.id}`} className={styles.link}>
                                    {gatewayData?.description}
                                </a>
                            </p>
                            <p><strong>Clé de session réseau:  </strong> {deviceData?.network_session_key}</p>
                            <p><strong>Clé de session d'application:  </strong> {deviceData?.application_session_key}</p>
                            <p><strong>Est mobile:  </strong> {deviceData?.is_mobile ? 'Oui' : 'Non'}</p>
                            <div className={styles.create_by}>
                                <p><strong>Créé le:  </strong> {new Date(deviceData?.created_at).toLocaleDateString()}</p>
                                <p><strong>Par:  </strong> {deviceData?.created_by}</p>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
                
                <div className={styles.actions}>
                    <div className={styles.delete}>
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 57) || profile.is_superuser) {
                                    setShowDeleteModal(true);
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }}
                            label="Supprimer l'appareil" 
                            className={styles.deleteButton} 
                        />
                    </div>
                    <div className={styles.others}>
                        <Button 
                            onClick={() => {  if (userHasPermitTo(permissions, 70) || userHasPermitTo(permissions, 34)) {
                                router.push(`/admin/devices/permissions/${id}`);
                            } else {
                                setShowNotPermitModal(true);
                            }
                        } }
                            label="Voir les données du capteur" 
                            className={styles.actionButton} 
                        />
                        <div className={styles.delete}>
                            <Button 
                                onClick={() => {
                                    if (userHasPermitTo(permissions, 56) || userHasPermitTo(permissions, 34)) {
                                        router.push('/admin/devices/update/' + id);
                                    } else {
                                        setShowNotPermitModal(true);
                                    }
                                }}
                                label={<><FaEdit /> Editer</>} 
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
                            onClick={handleDeleteDevice} 
                            autoFocus 
                        />
                    </div>
                } 
                onHide={() => setShowDeleteModal(false)}
            >
                <p>Veuillez confirmer la suppression de cet appareil !</p>
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

export default DetailDevice;
