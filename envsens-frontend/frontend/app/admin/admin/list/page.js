"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useRouter } from 'next/navigation';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import styles from './id.module.css';
import { Menu } from 'primereact/menu';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

const PolluantsList = () => {
    const [Polluant, setPolluant] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedPolluant, setSelectedPolluant] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const {token, profile,  permissions} = useSelector(state => state.auth);

    useEffect(() => {
        if(userHasPermitTo(permissions, 24) || profile.is_superuser){
            if (Polluant.length === 0 || loaded == false) {
                getPolluant();
                setLoaded(true);
            }}else{
                setShowNotPermitViewModal(true);
            }
    }, [token]);
const getPolluant = async () => {
            try {
                const response = await axios.get('admins/pollutants/list/', {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setPolluant(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
            }
        };

    const handleDeletePolluant = async () => {
        try {
            await axios.delete(`admins/pollutants/delete/${selectedPolluant.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Polluant supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setPolluant(Polluant.filter(polluant => polluant.id !== selectedPolluant.id));
        } catch (error) {
            console.error('Erreur lors de la suppression du Polluant', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du polluant', life: 5000 });
        }
    };

   
    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
        <p className={styles.titre}><FaChevronRight /> Listes de tous les polluants</p>
    </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => {if ( userHasPermitTo(permissions, 21) || profile.is_superuser ) {router.push("/admin/admin/")} else{setShowNotPermitModal(true)} }} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () =>{if ( userHasPermitTo(permissions, 72) || profile.is_superuser ) {router.push("/admin/admin/" + rowData.id)} else{setShowNotPermitModal(true)} }},
            { label: 'Ajouter un polluantrange', command: () =>{if ( userHasPermitTo(permissions, 49) || profile.is_superuser) {router.push("/admin/admin/polluant_range/create/" + rowData.id) }else{setShowNotPermitModal(true)} }},
            { label: 'Voir liste des pollants-ranges ', command: () =>{ if ( userHasPermitTo(permissions, 52) || profile.is_superuser) { setSelectedPolluant(rowData); router.push("/admin/admin/polluant_range/list/" + rowData.id); } else {setShowNotPermitModal(true)}}},
            { label: 'Modifier', command: () =>{if ( userHasPermitTo(permissions, 22) || profile.is_superuser) {router.push("/admin/admin/update/" + rowData.id) }else{setShowNotPermitModal(true)} }},
            { label: 'Supprimer', command: () =>{if ( userHasPermitTo(permissions, 23) || profile.is_superuser) { setSelectedPolluant(rowData); setShowDeleteModal(true); } else{setShowNotPermitModal(true)} }},
        ];
        const menu = useRef(null);

        return (
            <React.Fragment>
                <Menu model={menuItems} popup ref={menu} id={`menu_${rowData.id}`} />
                <Button
                    icon="pi pi-ellipsis-v"
                    onClick={(event) => menu.current.toggle(event)}
                    aria-controls={`menu_${rowData.id}`}
                    aria-haspopup
                    className="p-button-text"
                />
            </React.Fragment>
        );
    };

    const indexTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component" style={{ height: '100vh' }}>
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={Polluant} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="name" header="Nom" sortable />
                    <Column field="code" header="Code" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="unit" header="Unit" sortable />
                    <Column body={(rowData)=>new Date(rowData.created_at).toLocaleString()} header="Date d'ajout" sortable />
                    <Column field="created_by" header="Crée par" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeletePolluant} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer ce polluant ?</p>
            </Dialog>

            <Dialog header={
                <>
               <span style={{color:"red"}}><FaExclamationTriangle /> Alert</span>
                </>
            } visible={showNotPermitModal} style={{ width: '30vw' }} modal onHide={() => setShowNotPermitModal(false)}>
                <p>Vous n'etes pas autorisez à effectuer cette action !</p>
            </Dialog>

            <Dialog header={<>
               <span style={{color:"red"}}><FaExclamationTriangle /> Alert</span>
                </>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => {setShowNotPermitModal(false); router.back()}}>
                <p>Vous n'avez pas access à cette page !</p>
            </Dialog>

        </>
    );
};

export default PolluantsList;
