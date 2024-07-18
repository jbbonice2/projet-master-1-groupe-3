import React, { useEffect, useRef, useState } from 'react';
import axios from '@/app/axiosConfig';
import { Button } from 'primereact/button';
import { useParams, useRouter } from 'next/navigation';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import styles from './detail.module.css';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

const DetailPolluantRange = () => {
    const router = useRouter();
    const toast = useRef(null);
    const [polluantRangeData, setPolluantRangeData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [isMaxValueInclude, setIsMaxValueInclude] = useState(false); // Etat local pour isMaxValueInclude
    const { token, profile } = useSelector(state => state.auth);
    const { id_polluant, id_range } = useParams();

    useEffect(() => {
        if (parseInt(id_range) && polluantRangeData == null) {
            fetchPolluantRangeData(id_range);
        }
    }, [id_range, polluantRangeData]);

    const fetchPolluantRangeData = async (rangeId) => {
        try {
            const response = await axios.get(`/admins/pollutants/detail_polluant_range/${id_polluant}/ranges/${rangeId}/`, {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            setPolluantRangeData(response.data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        }
    };

    const handleDeletePolluantRange = async () => {
        try {
            await axios.delete(`/admins/pollutants/delete_polluant_range/${id_polluant}/ranges/${id_range}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'PolluantRange supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setPolluantRangeData(null);
        } catch (error) {
            console.error('Erreur lors de la suppression du PolluantRange', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du polluantRange', life: 5000 });
        }
    };

    useEffect(() => {
        if (id_range) {
            fetchPolluantRangeData(id_range);
        } else {
            console.log("Pas d'ID disponible");
        }
        if (!(profile.is_superuser || polluantRangeData?.created_by === profile.username || userHasPermitTo(permissions, 48))) {
            setShowNotPermitModal(true);
        }
    }, [id_range]);

    return (
        <div>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Information du PolluantRange : {polluantRangeData?.name}</p>
            </div>
            
            <div className={styles.container}>
                <Toast ref={toast} />
                <TabView>
                    <TabPanel header="Informations du polluantRange">
                        <div className={styles.cardBody}>
                            <p><strong>Nom du polluant:</strong> {polluantRangeData?.name}</p>
                            <div className={styles.create_by}>
                                <p><strong>Créé le:</strong> {new Date(polluantRangeData?.created_at).toLocaleDateString()}</p>
                                <p><strong>Par:</strong> {polluantRangeData?.created_by}</p>
                            </div>
                            <div className={styles.create_by}>
                                <p><strong>MaxValue:</strong> {polluantRangeData?.maxValue}</p>
                                <p><strong>MinValue:</strong> {polluantRangeData?.minValue}</p>
                            </div>
                            <div className={styles.text1}>
                                <p><strong>Display color:</strong> {polluantRangeData?.display_color}</p>
                                <p><strong>Quality:</strong> {polluantRangeData?.quality}</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="isMaxValueInclude">Inclure maxValue dans la plage ?</label>
                                <select id="isMaxValueInclude" value={isMaxValueInclude ? "true" : "false"} onChange={(e) => setIsMaxValueInclude(e.target.value === 'true')}>
                                    <option value="false">Non</option>
                                    <option value="true">Oui</option>
                                </select>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
                
                <div className={styles.actions}>
                    <div className={styles.delete}>
                        
                    </div>
                    <div className={styles.others}>
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 51) || profile.is_superuser) {
                                    setShowDeleteModal(true);
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }}
                            label="Supprimer le polluantRange" 
                            className={styles.deleteButton} 
                        />
                        <Button 
                            onClick={() => {
                                if (userHasPermitTo(permissions, 50) || profile.is_superuser) {
                                    router.push("/admin/admin/polluant_range/"+ id_polluant +"/update/" + id_range)
                                } else {
                                    setShowNotPermitModal(true);
                                }
                            }}
                            label="Modifier le polluantRange" 
                            className={styles.deleteButton} 
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
                            onClick={handleDeletePolluantRange} 
                            autoFocus 
                        />
                    </div>
                } 
                onHide={() => setShowDeleteModal(false)}
            >
                <p>Veuillez confirmer la suppression de ce polluantRange !</p>
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

export default DetailPolluantRange;
