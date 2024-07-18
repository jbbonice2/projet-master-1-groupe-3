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
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

const GroupsListForUser = () => {
    const [groups, setGroups] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState(null);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [groupFilter, setGroupFilter] = useState('');
    const [groupsToAdd, setGroupsToAdd] = useState(null);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const {token, profile, permissions} = useSelector(state => state.auth);
    const {id} = useParams();

    const fetchUserData = async (userId) => {
        await axios.get(`/users/${userId}/`, {
            headers: {
                "Authorization": "Bearer " + token.access
            }
        }).then((response) => {
            setUserData(response.data);
        }).catch((err) => {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        });
    };

    useEffect(() => {
        if (id && !userData) {
            if(userHasPermitTo(permissions, 12)){
                fetchUserData(id);
            }else{
                setShowNotPermitViewModal(true);
            }
        }
    }, [id, userData]);

    const addGroupsToUser = async () => {
        if (!selectedGroups) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner au moins un groupe', life: 3000 });
            return;
        }
        try {
            const data = {group_ids: selectedGroups.map(group => group.id)};
            await axios.post(`/users/add_groups_to_user/${id}/`, data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            const getGroups = async () => {
                try {
                    const response = await axios.get(`groups/list_groups_of_user/user/${id}/`, {
                        headers: {
                            "Authorization": "Bearer " + token.access
                        }
                    });
                    setGroups(response.data);
                } catch (error) {
                    console.log(error);
                    toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des groupes', life: 3000 });
                }
            };
            getGroups();
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Groupes ajoutés avec succès', life: 3000 });
            setShowAddGroupModal(false);
            setSelectedGroups(null);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de l\'ajout des groupes', life: 3000 });
        }
    };

    const fetchGroupsToAdd = async () => {
        try {
            const response = await axios.get(`/groups/list/`, {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            const data = response.data.filter((newGroup) => {
                return !groups.find((existingGroup) => existingGroup.id === newGroup.id);
            });
            setGroupsToAdd(data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des groupes', life: 3000 });
        }
    };

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () => {if(userHasPermitTo(permissions, 17) || profile.is_superuser) {router.push("/admin/groups/"+ rowData.id);}else{setShowNotPermitModal(true)} } },
            { label: 'Retirer de l\'utilisateur', command: () => {if(userHasPermitTo(permissions, 6) || profile.is_superuser) {setSelectedGroup(rowData); setShowDeleteModal(true);}else{setShowNotPermitModal(true)} }},
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
            <div className={styles.container_header}>
                <p className={styles.titre}><FaChevronRight />Liste des groupes de l'utilisateur : <strong>{userData?.username}</strong></p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <div className={styles.boutonleft}>
                <div className={styles.userlogin}>
                <img src={userData?.img_url ?`http://${window.location.host.split(":")[0]}:8000${userData.img_url}`:"/img-profile.jpg"} alt='logo' className={styles.logo} style={{width:"1rem" ,borderRadius:"9px"}}/>    
                <span style={{fontSize:"15pt"}}>{userData?.username}</span>
                </div>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => {  if(userHasPermitTo(permissions, 3) || profile.is_superuser){setShowAddGroupModal(true); fetchGroupsToAdd() }else{setShowNotPermitModal(true)}}} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        const getGroups = async () => {
            try {
                const response = await axios.get(`/groups/list_groups_of_user/user/${id}/`, {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setGroups(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des groupes', life: 3000 });
            }
        };
        getGroups();
    }, [token, id]);

    const handleDeleteGroup = async () => {
        try {
            await axios.delete(`/groups/delete_user_to_group/group/${selectedGroup?.id}/user/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Groupe supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setGroups(groups.filter(group => group.id !== selectedGroup?.id));
        } catch (error) {
            console.error('Erreur lors de la suppression du groupe', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du groupe', life: 5000 });
        }
    };
    const indexTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component">
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={groups} paginator rows={12} header={header} className="p-datatable-gridlines">
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="label" header="Label" sortable />
                    <Column field="code" header="Code" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="permissions_count" header="Permissions" sortable />
                    <Column field="users_count" header="Utilisateurs" sortable />
                    <Column field="created_at" header="Date ajout" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header={
                <h5 style={{textAlign:"center"}}>
                    Confirmer la suppression du groupe <strong>{selectedGroup?.label}</strong> de l'utilisateur {userData?.username} ?
                </h5>
            } visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteGroup} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer ce groupe de l'utilisateur ?</p>
            </Dialog>

            <Dialog maximizable header={<h3 style={{ textAlign: 'center' }}>Ajout de groupe(s) à l'utilisateur {userData?.usrname}</h3>} visible={showAddGroupModal} style={{ width: '100vw', height: '100vh', top: '0px' }} modal onHide={() => { setShowAddGroupModal(false); setGroupFilter('') }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div className="table-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                            <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGroupFilter(e.target.value)} />
                            <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                        </span>
                    </div>
                    <DataTable value={groupsToAdd} paginator rows={10} className="p-datatable p-component" globalFilter={groupFilter} responsiveLayout="scroll" selection={selectedGroups} onSelectionChange={(e) => setSelectedGroups(e.value)} dataKey="id">
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="label" header="Nom" sortable></Column>
                        <Column field="code" header="Code" sortable></Column>
                        <Column field="description" header="Description" sortable></Column>
                        <Column field="created_at" header="Date ajout" sortable></Column>
                    </DataTable>
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px' }}>
                        <Button className={styles.button} label="Annuler" onClick={() => { setShowAddGroupModal(false); setGroupFilter('') }} />
                        <Button className={styles.button} label="Confirmer" onClick={() => { addGroupsToUser() }} />
                    </div>
                </div>
            </Dialog>
            <Dialog header={<>
               <span style={{color:"red"}}><FaExclamationTriangle    /> Alert</span>
                </>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => {setShowNotPermitViewModal(false); router.back()}}>
                <p>Vous n'avez pas access à cette page !</p>
            </Dialog>
            <Dialog header={
                <>
               <span style={{color:"red"}}><FaExclamationTriangle /> Alert</span>
                </>
            } visible={showNotPermitModal} style={{ width: '30vw' }} modal onHide={() => setShowNotPermitModal(false)}>
                <p>Vous n'etes pas autorisez à effectuer cette action !</p>
            </Dialog>
        </>
    );
};

export default GroupsListForUser;
