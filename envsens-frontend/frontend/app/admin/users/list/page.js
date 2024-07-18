"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { useRouter } from 'next/navigation';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Password } from 'primereact/password';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import styles from './id.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const toast = useRef(null);
    const router = useRouter();
    const {token, profile,  permissions} = useSelector(state => state.auth);

    const schemaPassword = yup.object().shape({
        npassword: yup.string().required("Le nouveau Mot de passe est requis")
            .min(4, 'Le mot de passe doit contenir au moins 4 caractères')
            .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
            .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
            .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
        cpassword: yup.string()
            .oneOf([yup.ref('npassword'), null], 'Les mots de passe doivent correspondre')
            .required('Confirmation du mot de passe est requise'),
    });

    const { control: controlPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors } } = useForm({
        resolver: yupResolver(schemaPassword)
    });

    const onSubmitPassword = async (data) => {
        if (!selectedUser) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Aucun utilisateur sélectionné', life: 3000 });
            return;
        }

        try {

            await axios.put(`/users/reset_password/user/${selectedUser.id}/`, data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Mot de passe réinitialisé avec succès', life: 3000 });
            setShowResetPasswordModal(false);
        } catch (error) {
            console.error('Erreur lors du traitement de la requête', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la réinitialisation du mot de passe', life: 5000 });
        }
    };

    const actionBodyTemplate = (rowData) => {
        const menuItems = [
            { label: 'Voir Details', command: () =>{if (userHasPermitTo(permissions, 11) || profile.is_superuser ) {router.push("/admin/users/" + rowData.id)}else {setShowNotPermitModal(true)}}  },
            { label: 'Modifier', command: () => {if (userHasPermitTo(permissions, 68) || profile.is_superuser){router.push("/admin/users/update/" + rowData.id)}else {setShowNotPermitModal(true)}}},
            { label: 'Supprimer', command: () => {if (userHasPermitTo(permissions, 2) || profile.is_superuser){setSelectedUser(rowData); setShowDeleteModal(true);}else{setShowNotPermitModal(true)}}},
            { label: 'Réinitialiser le mot de passe', command: () => {if (userHasPermitTo(permissions, 4) || profile.is_superuser){setSelectedUser(rowData); setShowResetPasswordModal(true); }else{setShowNotPermitModal(true)}}} ,
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
                <p className={styles.titre}><FaChevronRight /> Liste des utilisateurs :</p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
                <Button label="Ajouter" icon="pi pi-plus" className="p-button-text" onClick={() => {if ((userHasPermitTo(permissions, 1) || profile.is_superuser)){ console.log(permissions)}else{setShowNotPermitModal(true)}}} style={{ backgroundColor: "#E6E6E6", borderRadius: "13px", color: "#828282" }} />
            </div>
        </div>
    );

    useEffect(() => {
        if (!(userHasPermitTo(permissions, 5) || profile.is_superuser)) {
            setShowNotPermitViewModal(true);
        }else{
            const getUsers = async () => {
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
        getUsers();
        }
        
    }, [token]);

    const handleDeleteUser = async () => {
        try {
            await axios.delete(`/users/delete/${selectedUser.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé avec succès', life: 3000 });
            setShowDeleteModal(false);
            setUsers(users.filter(user => user.id !== selectedUser.id));
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
            <div className="p-datatable p-component ">
                <DataTable globalFilter={globalFilter}   rowsPerPageOptions={[5, 10, 25, 50]} value={users} paginator rows={12} header={header} className="p-datatable-gridlines">
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column field="first_name" header="Nom" sortable />
                    <Column field="last_name" header="Prénom" sortable />
                    <Column field="created_at" header="Date ajout" sortable />
                    <Column field="username" header="Nom Utilisateur" sortable />
                    <Column field="permissions_count" header="Permissions" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>

            <Dialog header="Confirmation de suppression" visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)}   />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteUser} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
            </Dialog>

            <Dialog maximizable header="Réinitialiser le mot de passe" visible={showResetPasswordModal} style={{ width: '40vw', height: '100%' }} modal onHide={() => setShowResetPasswordModal(false)}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <form onSubmit={handleSubmitPassword(onSubmitPassword)} style={{ width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
                        <div className={styles.formGroup} style={{ marginLeft:"40%", width: '100%' }}>
                            <span style={{display:"flex", flexDirection:"column", gap:"10px"}}>
                                <Controller
                                    name="npassword"
                                    control={controlPassword}
                                    render={({ field }) => (
                                        <Password
                                            id="npassword"
                                            {...field}
                                            feedback={false}
                                            toggleMask
                                            placeholder='Nouveau Mot de passe'
                                        />
                                    )}
                                />
                                {passwordErrors.npassword && <small className="p-error">{passwordErrors.npassword.message}</small>}
                            </span>
                        </div>
                        <div className={styles.formGroup} style={{ marginLeft:"40%", width: '100%' }}>
                            <span style={{display:"flex", flexDirection:"column", gap:"10px"}}>
                                <Controller
                                    name="cpassword"
                                    control={controlPassword}
                                    render={({ field }) => (
                                        <Password
                                            id="cpassword"
                                            {...field}
                                            feedback={false}
                                            toggleMask
                                            placeholder='Confirmer Mot de passe'
                                        />
                                    )}
                                />
                                {passwordErrors.cpassword && <small className="p-error">{passwordErrors.cpassword.message}</small>}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Button className={styles.button} label="Réinitialiser" type="submit" />
                            <Button  className={styles.button} label="Annuler" type="button" onClick={() => setShowResetPasswordModal(false)} />
                        </div>
                    </form>
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
                </>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => {setShowNotPermitViewModal(false); router.back()}}>
                <p>Vous n'avez pas access à cette page !</p>
            </Dialog>

        </>
    );
};

export default UsersList;
