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
const DetailGroup = () => {
    const router = useRouter();
    const { id } = useParams();
    const toast = useRef(null);
    const [groupData, setGroupData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const { token, profile, permissions } = useSelector(state => state.auth);

    const fetchGroupData = async (groupId) => {
        try {
            const response = await axios.get(`/groups/detail/${groupId}/`, {
                headers: {
                    "Authorization": `Bearer ${token.access}`
                }
            });
            setGroupData(response.data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await axios.delete(`/groups/delete/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Groupe supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            router.push('/admin/groupes/list');
        } catch (error) {
            console.error('Erreur lors de la suppression du groupe', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du groupe', life: 5000 });
        }
    };

    useEffect(() => {
         
        if (id) {
            
            fetchGroupData(id);
        } else {
            console.log("Pas d'ID disponible");
        }
        if(!(userHasPermitTo(permissions, 11) || profile.is_superuser || groupData?.create_by === profile.username))  {
            setShowNotPermitModal(true)
        }    
    }, [id]);


    const userHasPermitTo = (permissions, permitId) => {
        return permissions.includes(permitId);
    };

    return (
        <div>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Information du Groupe : {groupData?.label}</p>
            </div>
            
            <div className={styles.container}>
                <Toast ref={toast} />
                <TabView>
                    <TabPanel header="Informations du groupe">
                        <div className={styles.cardBody}>
                            <p><strong>Label:</strong> {groupData?.label}</p>
                            <div className={styles.create_by}>
                                <p><strong>Créé le:</strong> {new Date(groupData?.created_at).toLocaleDateString()}</p>
                                <p><strong>Par:</strong> {groupData?.created_by}</p>
                            </div>
                            <div className={styles.text1}>
                                <p><strong>Description:</strong> {groupData?.description}</p>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
                
                <div className={styles.actions}>
                    <div className={styles.delete}>
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 20) || profile.username === groupData.created_by || profile.is_superuser) {
                                    setShowDeleteModal(true);
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }}
                            label="Supprimer le groupe" 
                            className={styles.deleteButton} 
                        />
                    </div>
                    <div className={styles.others}>
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 14) || profile.username === groupData.created_by || profile.is_superuser ) {
                                    router.push(`/admin/groupes/permissions/${id}`)
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }} 
                            label="Voir les permissions du groupe" 
                            className={styles.actionButton} 
                        />
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 13) || profile.username === groupData.created_by || profile.is_superuser ) {
                                    router.push(`/admin/groupes/users/${id}`)
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }} 
                            label="Voir les Utilisateurs Groupes" 
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
                            onClick={handleDeleteGroup} 
                            autoFocus 
                        />
                    </div>
                } 
                onHide={() => setShowDeleteModal(false)}
            >
                <p>Veuillez confirmer la suppression de ce groupe !</p>
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

export default DetailGroup;
