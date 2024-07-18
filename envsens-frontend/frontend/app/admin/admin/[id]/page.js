"use client";
import React, { useEffect, useRef, useState } from 'react';
import axios from '@/app/axiosConfig';
import { Button } from 'primereact/button';
import { useParams, useRouter } from 'next/navigation';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import styles from './detail.module.css';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { useSelector } from 'react-redux';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

// Composant DetailGroup
const DetailPolluant = () => {
    const router = useRouter();
    const { id } = useParams();
    const toast = useRef(null);
    const [pollantData, setPolluantData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const { token, profile, permissions} = useSelector(state => state.auth);

    const fetchPolluantData = async (pollantId) => {
        try {
            const response = await axios.get(`admins/pollutants/list_polluant_range/${pollantId}/`, {
                headers: {
                    "Authorization": `Bearer ${token.access}`
                }
            });
            setPolluantData(response.data);
        } catch (err) {

            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        }
    };

    const handleDeletePolluant = async () => {
        try {
            await axios.delete(`admins/pollutants/delete/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Polluant supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            router.push('/admin/admin/list/');
        } catch (error) {
            console.error('Erreur lors de la suppression du polluant', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du polluant', life: 5000 });
        }
    };

    useEffect(() => {
         
        if (id) {
            
            fetchPolluantData(id);
        } else {
            console.log("Pas d'ID disponible");
        }
        if(!(profile.is_superuser || pollantData?.create_by === profile.username || userHasPermitTo(permissions, 72) ))  {
            setShowNotPermitModal(true)
        }    
    }, [id]);


    const userHasPermitTo = (permissions, permitId) => {
        return permissions.includes(permitId);
    };

    return (
        <div>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Information du Polluant : {pollantData?.name}</p>
            </div>
            
            <div className={styles.container}>
                <Toast ref={toast} />
                <TabView>
                    <TabPanel header="Informations du polluant">
                        <div className={styles.cardBody}>
                            <p><strong>Nom:</strong> {pollantData?.name}</p>
                            <div className={styles.create_by}>
                                <p><strong>Créé le:</strong> {new Date(pollantData?.created_at).toLocaleDateString()}</p>
                                <p><strong>Par:</strong> {pollantData?.created_by}</p>
                            </div>
                            <div className={styles.text1}>
                                <p><strong>Description:</strong> {pollantData?.description}</p>
                                <p><strong>Unit:</strong> {pollantData?.unit}</p>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
                
                <div className={styles.actions}>
                    <div className={styles.delete}>
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 23 ) || profile.is_superuser) {
                                    setShowDeleteModal(true);
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }}
                            label="Supprimer le polluant" 
                            className={styles.deleteButton} 
                        />
                    </div>
                    <div className={styles.others}>
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 52) ||  profile.is_superuser ) {
                                    router.push(`/admin/admin/polluant_range/list/${id}`)
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }} 
                            label="Voir la liste polluant-range" 
                            className={styles.actionButton} 
                        />
                         <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 22) ||  profile.is_superuser ) {
                                    router.push(`/admin/admin/update/${id}/`)
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }} 
                            label="Edit  un polluant" 
                            className={styles.actionButton} 
                        />
                        
                       
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
                            onClick={handleDeletePolluant} 
                            autoFocus 
                        />
                    </div>
                } 
                onHide={() => setShowDeleteModal(false)}
            >
                <p>Veuillez confirmer la suppression de ce pollant !</p>
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

export default DetailPolluant;
