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
import userHasPermitTo from '@/app/utils';
import { FaExclamationTriangle } from 'react-icons/fa';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [groupData, setGroupData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userFilter, setUserFilter] = useState('');
    const [usersToAdd, setUsersToAdd] = useState(null);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const {token, profile, permissions} = useSelector(state => state.auth);
    const {id} = useParams();

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

    const addUsersToGroup = async () => {
        if (!selectedUsers) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner au moins un utilisateur', life: 3000 });
            return;
        }
        try{
            const data = {user_ids:selectedUsers.map(user => user.id)};
            axios.post('groups/add_users_to_group/'+id+'/',data ,
        {
            headers: {
                'Authorization': `Bearer ${token.access}`
            }
        });
        const getUsers = async () => {
            try {
                const response = await axios.get('/groups/list_users_in_group/group/'+id+'/', {
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
        getUsers();
        toast.current.show({ severity:'success', summary: 'Succès', detail: 'Utilisateurs ajoutés avec succès', life: 3000 });
        setShowAddUserModal(false);
        setSelectedUsers(null);
        }catch(error){
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de l\'ajout des utilisateurs', life: 3000 });
        }
    }

    const fetchUsersToAdd = async()=>{
        try{
            const response = await axios.get(`/users/list/`, {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            const data = response.data.filter((newUser) => {
                return !users.find((existingUser) => existingUser.id === newUser.id);
            });
            setUsersToAdd(data);
        }catch(error){
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
        }
    }

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () => {if (profile.id === rowData.id || userHasPermitTo(permissions, 11)|| profile.is_superuser){router.push("/admin/users/" + rowData.id)}else{setShowNotPermitModal(true)}} },
            { label: 'Retirer  du groupe', command: () => {if (profile.id === rowData.id || userHasPermitTo(permissions, 6) || profile.is_superuser || profile.username === groupData.created_by){setSelectedUser(rowData); setShowDeleteModal(true);}else{setShowNotPermitModal(true)} } },
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

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <h1>Liste des utilisateurs du groupe <strong>{groupData?.label}</strong></h1>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => {if(profile.username  === groupData.created_by) {setShowAddUserModal(true); fetchUsersToAdd()}else{setShowNotPermitModal(true); console.log(groupData);}}} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    useEffect(() => {
        const getUsers = async () => {
            try {
                const response = await axios.get('/groups/list_users_in_group/group/'+id+'/', {
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
        getUsers();
        
    }, [token, groupData]);


    useEffect(()=>{
        if (!(userHasPermitTo(permissions, 13) || profile.is_superuser || (groupData && groupData?.created_by == profile.username))) {
            setUsers([]);
            setShowNotPermitViewModal(true);
        }
    }, [ groupData])

    const handleDeleteUser = async () => {
        try {
            await axios.delete(`/users/delete/${selectedUser?.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setUsers(users.filter(user => user.id !== selectedUser?.id));
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de l\'utilisateur', life: 5000 });
        }
    };

    const indexTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component">
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={users} paginator rows={12} header={header} className="p-datatable-gridlines">
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="first_name" header="Nom" sortable />
                    <Column field="last_name" header="Prénom" sortable />
                    <Column field="created_at" header="Date ajout" sortable />
                    <Column field="username" header="Nom Utilisateur" sortable />
                    <Column field="permissions_count" header="Permissions" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header={
                <h5 style={{textAlign:"center"}}>
                    Confirmer la suppression de <strong>{selectedUser?.username}</strong> dans le groupe {groupData?.label} ?
                </h5>
            } visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)}   />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteUser} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer {selectedUser?.username } du groupe ?</p>
            </Dialog>

            <Dialog maximizable header={<h3 style={{ textAlign: 'center' }}>Ajout d'utilisateur(s) au groupe {groupData?.label}</h3>} visible={showAddUserModal} style={{ width: '100vw', height: '100vh', top:'0px' }} modal onHide={() => {setShowAddUserModal(false), setUserFilter('')}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div className="table-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                        
                        <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                            <InputText type="search" placeholder="Rechercher..." onInput={(e) => setUserFilter(e.target.value)} />
                            <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                        </span>
                    </div>
                    <DataTable value={usersToAdd} paginator rows={10} className="p-datatable p-component" globalFilter={userFilter} responsiveLayout="scroll" selection={selectedUsers} onSelectionChange={(e)=>setSelectedUsers(e.value)} dataKey="id">
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="username" header="Nom d'utilisateur" sortable></Column>
                        <Column field="first_name" header="Nom" sortable></Column>
                        <Column field="last_name" header="Prenom" sortable></Column>
                    </DataTable>
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px' }}>
                        <Button className={styles.button} label="Annuler" onClick={() => {setShowAddUserModal(false); setUserFilter('')}} />
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

export default UsersList;
