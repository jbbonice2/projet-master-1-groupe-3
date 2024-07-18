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

const GroupsList = () => {
    const [groups, setGroups] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
 
    const [users, setUsers] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const {token, profile,  permissions} = useSelector(state => state.auth);

    useEffect(() => {
        if(userHasPermitTo(permissions, 19) || profile.is_superuser){
            if (groups.length === 0 || loaded == false) {
                getGroups();
                setLoaded(true);
            }}else{
                setShowNotPermitViewModal(true);
            }
    }, [token]);
const getGroups = async () => {
            try {
                const response = await axios.get('/groups/list/', {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setGroups(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
            }
        };
    const handleAddUsers = async () => {
        try {
            const response = await axios.get('/users/list/', {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            setUsers(response.data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await axios.delete(`/groups/delete/${selectedGroup.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Groupe supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setGroups(groups.filter(group => group.id !== selectedGroup.id));
        } catch (error) {
            console.error('Erreur lors de la suppression du groupe', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du groupe', life: 5000 });
        }
    };

    const addUsersToGroup = async () => {
        if (!selectedUsers) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner au moins un utilisateur', life: 3000 });
            return;
        }
        try{
            const data = {user_ids:selectedUsers.map(user => user.id)};
            console.log(data);
            axios.post('groups/add_users_to_group/'+selectedGroup.id+'/',data ,
        {
            headers: {
                'Authorization': `Bearer ${token.access}`
            }
        });
        getGroups();
        toast.current.show({ severity:'success', summary: 'Succès', detail: 'Utilisateurs ajoutés avec succès', life: 3000 });
        setShowAddUserModal(false);
        setSelectedUsers(null);
        }catch(error){
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de l\'ajout des utilisateurs', life: 3000 });
        }
    }

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
        <p className={styles.titre}><FaChevronRight /> Listes de tous les groupes</p>
    </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => router.push("/admin/groupes/")} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () =>{if ( userHasPermitTo(permissions, 17) || profile.is_superuser ) {router.push("/admin/groupes/" + rowData.id)} else{setShowNotPermitModal(true)} }},
            { label: 'Ajouter un Utilisateur', command: () =>{ if (userHasPermitTo(permissions, 3) || profile.is_superuser ) { setSelectedGroup(rowData); setShowAddUserModal(true); handleAddUsers(); } else {setShowNotPermitModal(true)}}},
            { label: 'Modifier', command: () =>{if (userHasPermitTo(permissions, 69) || profile.is_superuser ) {router.push("/admin/groupes/update/" + rowData.id) }else{setShowNotPermitModal(true)} }},
            { label: 'Supprimer', command: () =>{if (userHasPermitTo(permissions, 20) || profile.is_superuser  ) { setSelectedGroup(rowData); setShowDeleteModal(true); } else{setShowNotPermitModal(true)} }},
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
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={groups} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="label" header="Label" sortable />
                    <Column field="code" header="Code" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="created_at" header="Date d'ajout" sortable />
                    <Column field="users_count" header=" Utilisateurs" sortable />
                    <Column field="permissions_count" header="Permissions" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteGroup} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer ce groupe ?</p>
            </Dialog>

            <Dialog header={<h3 style={{ textAlign: 'center' }}>Ajout d'utilisateur(s) au groupe {selectedGroup?.code}</h3>} visible={showAddUserModal} style={{ width: '100vw', height: '100vh', top:'0px' }} modal onHide={() => {setShowAddUserModal(false), setUserFilter('')}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div className="table-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                        
                        <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                            <InputText type="search" placeholder="Rechercher..." onInput={(e) => setUserFilter(e.target.value)} />
                            <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                        </span>
                    </div>
                    <DataTable value={users} paginator rows={10} className="p-datatable p-component" globalFilter={userFilter} responsiveLayout="scroll" selection={selectedUsers} onSelectionChange={(e)=>setSelectedUsers(e.value)} dataKey="id">
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="username" header="Nom d'utilisateur" sortable></Column>
                        <Column field="first_name" header="Nom" sortable></Column>
                        <Column field="last_name" header="Prenom" sortable></Column>
                    </DataTable>
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px' }}>
                        <Button className={styles.button} label="Annuler" onClick={() => {setShowAddUserModal(false),setUserFilter('')}} />
                        <Button className={styles.button} label="Confirmer" onClick={() => { addUsersToGroup()}} />
                    </div>
                </div>
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

export default GroupsList;
