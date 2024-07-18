"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import axios from '@/app/axiosConfig';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import LanguageForm from './LanguageForm'; // Assurez-vous de créer un LanguageForm similaire à CountryForm
import { useSelector } from 'react-redux';
import userHasPermitTo from '@/app/utils';
import { InputText } from 'primereact/inputtext';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { Menu } from 'primereact/menu';
import styles from './id.module.css';

const LanguagesList = () => {
    const toast = useRef(null);
    const { token, permissions, profile } = useSelector(state => state.auth);
    const [languages, setLanguages] = useState([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            const response = await axios.get('/languages/', { // Assurez-vous que l'endpoint est correct
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            setLanguages(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération de la liste des langues', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des langues', life: 3000 });
        }
    };

    const onCreate = () => {
        setShowCreateDialog(true);
    };

    const onEdit = (language) => {
        setSelectedLanguage(language);
        setShowEditDialog(true);
    };

    const onDelete = (language) => {
        setSelectedLanguage(language);
        setShowDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/language/${selectedLanguage.id}/delete/`, { // Assurez-vous que l'endpoint est correct
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current?.show({ severity: 'success', summary: 'Ok', detail: 'Langue supprimée avec succès.', life: 3000 });
            fetchLanguages();
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Erreur lors de la suppression de la langue', error);
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de la langue.', life: 3000 });
        }
    };

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Liste des Langues :</p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => {if (userHasPermitTo(permissions, 29)|| profile.is_superuser){onCreate()}else{setShowNotPermitModal(true)}}} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    const indexTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Modifier', command: () => {if (userHasPermitTo(permissions, 30)){onEdit(rowData)}else{setShowNotPermitModal(true)}}},
            { label: 'Supprimer', command: () => {if (userHasPermitTo(permissions, 31)){onDelete(rowData)}else{setShowNotPermitModal(true)}}},
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

    return (
        <div>
            <Toast ref={toast} />
            <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={languages} paginator rows={12} header={header} >
                <Column body={indexTemplate} header="Num" sortable />
                <Column field="code" header="Code" />
                <Column field="label" header="Label" />
                <Column
                    body={actionBodyTemplate}
                    header="Actions"
                />
            </DataTable>

            <Dialog header="Créer une langue" visible={showCreateDialog} style={{ width: '50vw' }} onHide={() => setShowCreateDialog(false)}>
                <div style={{ alignItems: "center", marginLeft: "10rem" }}>
                    <LanguageForm onSuccess={() => { fetchLanguages(); setShowCreateDialog(false); }} />
                </div>
            </Dialog>

            <Dialog header="Modifier une langue" visible={showEditDialog} style={{ width: '50vw' }} onHide={() => setShowEditDialog(false)}>
                <div style={{ alignItems: "center", marginLeft: "10rem" }}>
                    <LanguageForm language={selectedLanguage} onSuccess={() => { fetchLanguages(); 
                        toast.current?.show({ severity: 'success', summary: 'Ok', detail: 'Donnée mise à jour avec succès !', life: 3000 });
                        setShowEditDialog(false); }} 
                        onError={() => {
                            toast.current?.show({ severity: 'error', summary: 'Oups !', detail: 'Quelque chose a mal tourné..😅', life: 3000 });
                        }} 
                    />
                </div>
            </Dialog>

            <Dialog header={<><span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span></>} visible={showDeleteDialog} style={{ width: '50vw' }} onHide={() => setShowDeleteDialog(false)}>
                <p>Voulez-vous vraiment supprimer cette langue ?</p>
                <div className='btn_div'>
                    <Button label="Oui" className='button' icon="pi pi-check" onClick={handleDelete} />
                    <Button label="Non" className='button' icon="pi pi-times" onClick={() => setShowDeleteDialog(false)} />
                </div>
            </Dialog>

            <Dialog header={<><span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span></>} visible={showNotPermitModal} style={{ width: '30vw' }} modal onHide={() => setShowNotPermitModal(false)}>
                <p>Vous n'êtes pas autorisé à effectuer cette action !</p>
            </Dialog>
        </div>
    );
};

export default LanguagesList;
