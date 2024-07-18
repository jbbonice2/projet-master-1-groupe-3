"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import styles from './id.module.css';
import { Menu } from 'primereact/menu';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

const NetworkGatewayList = () => {
    const [devices, setDevices] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);

    const { id } = useParams();
    const [loaded, setLoaded] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const { token, profile, permissions } = useSelector(state => state.auth);

    useEffect(() => {
        if (userHasPermitTo(permissions, 53) || profile.is_superuser) {
            if (devices.length === 0 || loaded === false) {
                getDevices();
                setLoaded(true);
            }
        } else {
            setShowNotPermitViewModal(true);
        }
    }, [token]);

    const getDevices = async () => {
        try {
            const response = await axios.get(`/network/${id}/gateways/`, {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            setDevices(response.data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des appareils', life: 3000 });
        }
    };

    const handleDeleteDevice = async () => {
        try {
            await axios.delete(`/devices/delete/${selectedDevice.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Appareil supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setDevices(devices.filter(device => device.id !== selectedDevice.id));
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'appareil', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de l\'appareil', life: 5000 });
        }
    };

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Liste des Passerelles du reseau {id}</p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => { if (userHasPermitTo(permissions, 55) || profile.is_superuser) { router.push("/admin/devices/") } }} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () => { if (userHasPermitTo(permissions, 54) || profile.is_superuser) { router.push("/admin/devices/" + rowData.id) } else { setShowNotPermitModal(true) } }},
            { label: 'Modifier', command: () => { if (userHasPermitTo(permissions, 56) || profile.is_superuser) { router.push("/admin/devices/update/" + rowData.id) } else { setShowNotPermitModal(true) } }},
            { label: 'Supprimer', command: () => { if (userHasPermitTo(permissions, 57) || profile.is_superuser) { setSelectedDevice(rowData); setShowDeleteModal(true); } else { setShowNotPermitModal(true) } }},
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

    const coordinatesTemplate = (rowData) => {
        return `${rowData.latitude_read}, ${rowData.longitude_read}`;
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component" style={{ height: '100vh' }}>
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={devices} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="gwId" header="GwId" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="location_name" header="Location Name" sortable />
                    <Column field="location_description" header="Location Description" sortable />
                    <Column body={coordinatesTemplate} header="Coordinates" sortable />
                    <Column field='network_name' header="Reseau" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteDevice} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer cet appareil ?</p>
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

export default NetworkGatewayList;
