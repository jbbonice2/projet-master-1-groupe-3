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

const DetailNetwork = () => {
    const router = useRouter();
    const { id } = useParams();
    const toast = useRef(null);
    const [networkData, setNetworkData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchNetworkData = async (networkId) => {
        try {
            const response = await axios.get(`/networks/${networkId}/`, {
                headers: {
                    "Authorization": `Bearer ${token.access}`
                }
            });
            setNetworkData(response.data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        }
    };

    const handleDeleteNetwork = async () => {
        try {
            await axios.delete(`/networks/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Réseau supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            router.push('/admin/networks/list');
        } catch (error) {
            console.error('Erreur lors de la suppression du réseau', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du réseau', life: 5000 });
        }
    };

    useEffect(() => {
        if (id) {
            fetchNetworkData(id);
        } else {
            console.log("Pas d'ID disponible");
        }
        if (!(userHasPermitTo(permissions, 54) || profile.is_superuser || networkData?.created_by === profile.username)) {
            setShowNotPermitModal(true);
        }
    }, [id]);

    return (
        <div>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Informations du réseau : {networkData?.name}</p>
            </div>
            
            <div className={styles.container}>
                <Toast ref={toast} />
                <TabView>
                    <TabPanel header="Informations du réseau">
                        <div className={styles.cardBody}>
                            <p><strong>Nom:  </strong> {networkData?.name}</p>
                            <p><strong>Description:  </strong> {networkData?.description}</p>
                            <p><strong>Ville:  </strong> {networkData?.city}</p>
                            <p><strong>Nombre d'appareils:  </strong> {networkData?.num_devices}</p>
                            <p><strong>Nombre de passerelles:  </strong> {networkData?.num_gateways}</p>
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
                            label="Supprimer le réseau" 
                            className={styles.deleteButton} 
                        />
                    </div>
                    <div className={styles.others}>
                        <Button 
                            onClick={() => {  if (userHasPermitTo(permissions, 53) || userHasPermitTo(permissions, 34)) {
                                router.push(`/admin/networks/${id}/devices/`);
                            } else {
                                setShowNotPermitModal(true);
                            }
                        } }
                            label="Voir les Capteurs du réseau" 
                            className={styles.actionButton} 
                        />
                        <Button 
                            onClick={() => {  if (userHasPermitTo(permissions, 53) || userHasPermitTo(permissions, 34)) {
                                router.push(`/admin/networks/${id}/gateways/`);
                            } else {
                                setShowNotPermitModal(true);
                            }
                        } }
                            label="Voir les Passerelles du réseau" 
                            className={styles.actionButton} 
                        />
                        <div className={styles.delete}>
                            <Button 
                                onClick={() => {
                                    if (userHasPermitTo(permissions, 56) || userHasPermitTo(permissions, 34)) {
                                        router.push('/admin/networks/update/' + id);
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
                            onClick={handleDeleteNetwork} 
                            autoFocus 
                        />
                    </div>
                } 
                onHide={() => setShowDeleteModal(false)}
            >
                <p>Veuillez confirmer la suppression de ce réseau !</p>
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

export default DetailNetwork;
