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

const GatewayList = () => {
    const [gateway, setGateway] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedGateway, setSelectedGateway] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);

    const [loaded, setLoaded] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const { token, profile, permissions } = useSelector(state => state.auth);

    useEffect(() => {
        if (userHasPermitTo(permissions, 63) || profile.is_superuser) {
            if (gateway.length === 0 || loaded === false) {
                getGateway();
                setLoaded(true);
            }
        } else {
            setShowNotPermitViewModal(true);
        }
    }, [token]);

    const getGateway = async () => {
        try {
            const response = await axios.get('/admins/gateways/list/', {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            setGateway(response.data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des gateways', life: 3000 });
        }
    };

    const handleDeletegateway = async () => {
        try {
            await axios.delete(`/admins/gateways/delete/${selectedGateway.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Gateway supprimée avec succès', life: 3000 });
            setShowDeleteModal(false);
            setGateway(gateway.filter(gateway => gateway.id !== selectedGateway.id));
        } catch (error) {
            console.error('Erreur lors de la suppression de la gateway', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de la gateway', life: 5000 });
        }
    };

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Liste de toutes les gateways</p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => { if (userHasPermitTo(permissions, 65) || profile.is_superuser) { router.push("/admin/gateway/") } }} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () => { if (userHasPermitTo(permissions, 64) || profile.is_superuser) { router.push("/admin/gateway/" + rowData.id) } else { setShowNotPermitModal(true) } }},
            { label: 'Modifier', command: () => { if (userHasPermitTo(permissions, 66) || profile.is_superuser) { router.push("/admin/gateway/update/" + rowData.id) } else { setShowNotPermitModal(true) } }},
            { label: 'Supprimer', command: () => { if (userHasPermitTo(permissions, 67) || profile.is_superuser) { setSelectedGateway(rowData); setShowDeleteModal(true); } else { setShowNotPermitModal(true) } }},
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

    const locationTemplate = (rowData) => {
        return `${rowData.longitude_read} - ${rowData.latitude_read}`;
    };
    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component" style={{ height: '100vh' }}>
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={gateway} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="network_name" header="Network-Name" sortable />
                    <Column field="network" header="Network" sortable />
                    <Column body={locationTemplate} header="Location" sortable />
                    <Column field="location_description" header="location_description" sortable />
                    <Column field="location_name" header="Location_name" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column body={(rowData)=>new Date(rowData.created_at).toLocaleString()} header="Date d'ajout" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeletegateway} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer cette ville ?</p>
            </Dialog>

            <Dialog header={
                <>
                   <span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span>
                </>
            } visible={showNotPermitModal} style={{ width: '30vw' }} modal onHide={() => setShowNotPermitModal(false)}>
                <p>Vous n'êtes pas autorisé à effectuer cette action !</p>
            </Dialog>

            <Dialog header={
                <>
                   <span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span>
                </>
            } visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => { setShowNotPermitModal(false); router.back() }}>
                <p>Vous n'avez pas accès à cette page !</p>
            </Dialog>
        </>
    );
};

export default GatewayList;
