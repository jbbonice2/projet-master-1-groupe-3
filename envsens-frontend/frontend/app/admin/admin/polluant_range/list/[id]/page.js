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

const PolluantsRangeList = () => {
    const [PolluantRange, setPolluantRange] = useState([]);
    const [polluant, setpolluant] = useState([]);
    const [Polluant, setPolluant] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedPolluantRange, setSelectedPolluantRange] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const { id } = useParams();
    const {token, profile,  permissions} = useSelector(state => state.auth);

    useEffect(() => {
        if(userHasPermitTo(permissions, 52) || profile.is_superuser){
            if (PolluantRange.length === 0 || loaded == false) {
                getPolluantRange();
                setLoaded(true);
            }}else{
                setShowNotPermitViewModal(true);
            }
    }, [token]);
const getPolluantRange = async () => {
            try {
                const response = await axios.get(`admins/pollutants/list_polluant_range/${id}/`, {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setPolluantRange(response.data.ranges);
                setpolluant(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des polluantsranges', life: 3000 });
            }
        };

    const handleDeletePolluantRange = async () => {
        try {
            await axios.delete(`/admins/pollutants/delete_polluant_range/${id}/ranges/${selectedPolluantRange.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'PolluantRange supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            
            setPolluant(PolluantRange.filter(polluantRange => polluantRange.id !== selectedPolluantRange.id));
        } catch (error) {
            console.error('Erreur lors de la suppression du PolluantRange', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du polluantrange', life: 5000 });
        }
    };

   
    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
        <p className={styles.titre}><FaChevronRight /> Listes de tout les polluantsranges du pollants: {polluant.name}</p>
    </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() =>{if ( userHasPermitTo(permissions, 49) || profile.is_superuser ) { router.push(`/admin/admin/polluant_range/create/${id}/`)} else{setShowNotPermitModal(true)} }} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () =>{if ( userHasPermitTo(permissions, 48) || profile.is_superuser ) {router.push("/admin/admin/polluant_range/detail/"+ polluant.id + "/"+ rowData.id)} else{setShowNotPermitModal(true)} }},
            { label: 'Modifier', command: () =>{if ( userHasPermitTo(permissions, 50) || profile.is_superuser ) {router.push("/admin/admin/polluant_range/"+ polluant.id +"/update/" + rowData.id ) }else{setShowNotPermitModal(true)} }},
            { label: 'Supprimer', command: () =>{if ( userHasPermitTo(permissions, 51) || profile.is_superuser ) { setSelectedPolluantRange(rowData); setShowDeleteModal(true); } else{setShowNotPermitModal(true)} }},
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
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={PolluantRange} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="minValue" header="MinValue" sortable />
                    <Column field="maxValue" header="MaxValue" sortable />
                    <Column  body={(rowData) => (
                                <div style={{ backgroundColor: rowData.display_color }}>
                                {rowData.display_color}
                                </div>
                            )} 
                            header="Display Color"   sortable />
                    <Column field="quality" header="Quality" sortable />
                    <Column body={(rowData)=>new Date(rowData.created_at).toLocaleString()} header="Date d'ajout" sortable />
                    <Column field="created_by" header="Crée par" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeletePolluantRange} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer ce polluantrange ?</p>
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

export default PolluantsRangeList;
