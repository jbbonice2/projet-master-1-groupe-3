"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import styles from './id.module.css';
import { FaChevronRight } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

const PermissionsList = () => {
    const [permissions, setPermissions] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState(null);
    const [showAddPermissionModal, setShowAddPermissionModal] = useState(false);
    const [groupData, setGroupData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [permissionFilter, setPermissionFilter] = useState('');
    const [permissionsToAdd, setPermissionsToAdd] = useState(null);
    const toast = useRef(null);
    const router = useRouter();
    const {id} = useParams();
    const {token, profile, permissions:permissionsLis} = useSelector(state => state.auth);

    const fetchGroupData = async (groupId) => {
        await axios.get(`/groups/detail/${groupId}/`, {
            headers: {
                "Authorization": "Bearer " + token.access
            }
        }).then((response) => {
            setGroupData(response.data);
        }).catch((err) => {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        });
    };

    useEffect(()=>{
        if(id && !groupData){
            fetchGroupData(id);
        }
    })

    const addPermissionsToGroup = async () => {
        if (!selectedPermissions) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner au moins un utilisateur', life: 3000 });
            return;
        }
        try{
            const data = {permission_ids:selectedPermissions.map(permission => permission.id)};
            axios.post('groups/add_permissions_to_group/'+id+'/',data ,
        {
            headers: {
                'Authorization': `Bearer ${token.access}`
            }
        });
        const getPermissions = async () => {
            try {
                const response = await axios.get('/groups/list_group_permissions/group/'+id+'/', {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setPermissions(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
            }
        };
        getPermissions();
        toast.current.show({ severity:'success', summary: 'Succès', detail: 'Utilisateurs ajoutés avec succès', life: 3000 });
        setShowAddPermissionModal(false);
        setSelectedPermissions(null);
        }catch(error){
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de l\'ajout des utilisateurs', life: 3000 });
        }
    }

    const fetchPermissionsToAdd = async()=>{
        try{
            const response = await axios.get(`/permissions/list/`, {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            const data = response.data.filter((newPermission) => {
                return !permissions.find((existingPermission) => existingPermission.id === newPermission.id);
            });
            setPermissionsToAdd(data);
        }catch(error){
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
        }
    }

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: '', command: () => null },
            { label: 'Retirer  la permission', command: () =>{if ( userHasPermitTo(permissionsLis, 10) || profile.is_superuser ) { setSelectedPermission(rowData); setShowDeleteModal(true); }else{setShowNotPermitModal(true)} }  },
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

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight /> Liste des Permissions du groupe : <strong>{groupData?.label}</strong></p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => {if ( userHasPermitTo(permissionsLis, 9) || profile.is_superuser ) {setShowAddPermissionModal(true); fetchPermissionsToAdd()} else{setShowNotPermitModal(true)} }  } style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    useEffect(() => {
        const getPermissions = async () => {
            try {
                const response = await axios.get('groups/list_group_permissions/group/'+id+'/', {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setPermissions(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
            }
        };
        getPermissions();
    }, [token]);

    const handleDeletePermission = async () => {
        try {
            await axios.delete(`/groups/remove/group/${id}/permission/${selectedPermission?.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setPermissions(permissions.filter(permission => permission.id !== selectedPermissions?.id));
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de l\'utilisateur', life: 5000 });
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component">
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={permissions} paginator rows={12} header={header} className="p-datatable-gridlines">
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="name" header="Nom" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="created_at" header="Date ajout" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header={
                <h5 style={{textAlign:"center"}}>
                    Confirmer le retrait de la permission <strong>{selectedPermission?.name}</strong> dans le groupe {groupData?.label} ?
                </h5>
            } visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)}   />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeletePermission} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir le faire ?</p>
            </Dialog>

            <Dialog maximizable header={<h3 style={{ textAlign: 'center' }}>Ajout de(s) permission(s) au groupe {groupData?.label}</h3>} visible={showAddPermissionModal} style={{ width: '100vw', height: '100vh', top:'0px' }} modal onHide={() => {setShowAddPermissionModal(false), setPermissionFilter('')}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div className="table-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                        
                        <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                            <InputText type="search" placeholder="Rechercher..." onInput={(e) => setPermissionFilter(e.target.value)} />
                            <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                        </span>
                    </div>
                    <DataTable value={permissionsToAdd} paginator rows={10} className="p-datatable p-component" globalFilter={permissionFilter} responsiveLayout="scroll" selection={selectedPermissions} onSelectionChange={(e)=>setSelectedPermissions(e.value)} dataKey="id">
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="name" header="Nom" sortable></Column>
                        <Column field="description" header="Nom" sortable></Column>
                        <Column field="created_at" header="Créée le " sortable></Column>
                        <Column field="created_by" header="Créée Par " sortable></Column>
                    </DataTable>
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px' }}>
                        <Button className={styles.button} label="Annuler" onClick={() => {setShowAddPermissionModal(false); setPermissionFilter('')}} />
                        <Button className={styles.button} label="Confirmer" onClick={() => { addPermissionsToGroup()}} />
                    </div>
                </div>
            </Dialog>

           

        </>
    );
};

export default PermissionsList;
