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
import { Image } from 'react-bootstrap';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

const GroupsList = () => {
    const [groups, setGroups] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState(null);
    const [groupsOthers, setOthersGroups] = useState([]);
    const [userInf, setUserInf] = useState(null);
    const toast = useRef(null);
    const router = useRouter();
    const { token, profile, permissions } = useSelector(state => state.auth);

    useEffect(() => {
        const getGroups = async () => {
            try {
                const response = await axios.get('/users/'+id+ '/groups/', {
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

        const getUserInf = async()=>{
            try {
                const response = await axios.get('/users/'+id+'/', {
                    headers: {
                        "Authorization": "Bearer " + token.access
                    }
                });
                setUserInf(response.data);
            } catch (error) {
                console.log(error);
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération de l\'utilisateur', life: 3000 });
            }
        };
        getUserInf();
        getGroups();
    }, [token]);

    const getOthersGroups = async () => {
        try {
            const response = await axios.get('/users/'+id+'/no-groups/', {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            setOthersGroups(response.data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des utilisateurs', life: 3000 });
        }
    };

    const handleDeleteToGroup = async () => {
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

    const addGroupsToUser = async () => {
        if (!selectedGroups) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner au moins un utilisateur', life: 3000 });
            return;
        }
        try{
            axios.post('/users/add_groups/'+id+'/', [selectedGroups.map(group => group.id)],
        {
            headers: {
                'Authorization': `Bearer ${token.access}`
            }
        });
        toast.current.show({ severity:'success', summary: 'Succès', detail: 'Utilisateurs ajoutés avec succès', life: 3000 });
        setShowAddGroupModal(false);
        setSelectedGroups(null);
        }catch(error){
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de l\'ajout des utilisateurs', life: 3000 });
        }
    }

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <h1>Liste de tous les groupes</h1>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <div>
                    <span className="text-muted">
                        <strong>{userInf?.username}</strong>
                        <Image src='/img-profile.jpg' alt='Profile' sizes='30%'/>
                    </span>
                    {userHasPermitTo(permissions, 15) || profile.is_superuser ? (
                        <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => getOthersGroups()} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
                    ) : null}
                </div>
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () =>{if (userHasPermitTo(permissions, 11) || profile.is_superuser ) {router.push("/admin/groupes/" + rowData.id)}else {setShowNotPermitModal(true)}}  },
            { label: 'Supprimer', command: () => {if (userHasPermitTo(permissions, 11) || profile.is_superuser) { setSelectedGroup(rowData);  setShowDeleteModal(true);    } else {  setShowNotPermitModal(true); // Show modal or handle permission denial
              }
            }
          }
        ];
        const menu = useRef(null);
        return (
            <React.Fragment>
                <Menu model={menuItems} popup ref={menu} id={`menu_${rowData.id}`} />
                {userHasPermitTo(permissions, 15) || profile.is_superuser ? (
                    <Button
                        icon="pi pi-ellipsis-v"
                        onClick={(event) => menu.current.toggle(event)}
                        aria-controls={`menu_${rowData.id}`}
                        aria-haspopup
                        className="p-button-text"
                    />
                ) : null}
            </React.Fragment>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component" style={{ height: '100vh' }}>
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={groups} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column field="id" header="Num" sortable />
                    <Column field="label" header="Label" sortable />
                    <Column field="code" header="Code" sortable />
                    <Column field="description" header="Description" sortable />
                    <Column field="created_at" header="Date d'ajout" sortable />
                    <Column field="groups_count" header=" Utilisateurs" sortable />
                    <Column field="permissions_count" header="Permissions" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)} />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteToGroup} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer ce groupe ?</p>
            </Dialog>

            <Dialog header={<h3 style={{ textAlign: 'center' }}>Ajout d'utilisateur(s) au groupe {selectedGroup?.code}</h3>} visible={showAddGroupModal} style={{ width: '100vw', height: '100vh', top:'0px' }} modal onHide={() => {setShowAddGroupModal(false), setGroupFilter('')}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div className="table-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                        
                        <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                            <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGroupFilter(e.target.value)} />
                            <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                        </span>
                    </div>
                    <DataTable value={groups} paginator rows={10} className="p-datatable p-component" globalFilter={groupFilter} responsiveLayout="scroll" selection={selectedGroups} onSelectionChange={(e)=>setSelectedGroups(e.value)} dataKey="id">
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="label" header="Label du Groupe" sortable></Column>
                        <Column field="code" header="Code " sortable></Column>
                        <Column field="description" header="Description" sortable></Column>
                        <Column field="created_at" header="Date de Creation" sortable></Column>
                    </DataTable>
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px' }}>
                        <Button className={styles.button} label="Annuler" onClick={() => {setShowAddGroupModal(false),setGroupFilter('')}} />
                        {userHasPermitTo(permissions, 15) || profile.is_superuser ? (
                            <Button className={styles.button} label="Confirmer" onClick={() => { addGroupsToUser()}} />
                        ) : null}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default GroupsList;
