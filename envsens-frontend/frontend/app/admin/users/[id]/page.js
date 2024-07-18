"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '@/app/axiosConfig';
import { FaEdit, FaExclamationTriangle, FaTrash, FaUpload } from 'react-icons/fa';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import styles from './id.module.css';
import { Dialog } from 'primereact/dialog';
import { clearAuth } from '@/app/redux/slices/authSlice';
import { FaChevronRight } from 'react-icons/fa';
import userHasPermitTo from '@/app/utils';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    password: yup.string()
        .required("Mot de passe actuel est requis"),
    npassword: yup.string()
        .required("Le nouveau Mot de passe est requis")
        .min(4, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    cpassword: yup.string()
        .oneOf([yup.ref('npassword'), null], 'Les mots de passe doivent correspondre')
        .required('Confirmation du mot de passe est requise'),
});

const UserDetails = () => {
    const router = useRouter();
    const { id } = useParams();
    const {token, profile,  permissions} = useSelector(state => state.auth);
    const toast = useRef(null);
    const [userData, setUserData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showNotPermitModal, setShowNotPermitModal] = useState(false);

    const imgInput = useRef(null);
    const { control, register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        if (id) {
            if(userHasPermitTo(permissions, 11) || profile.is_superuser){
                fetchUserData(id);
            }else{
                setShowNotPermitModal(true);
            }
        }
    }, [id]);

    const onSubmit = async (data) => {
        try {
            await axios.post('/users/change-password/', data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Mot de passe changé avec succès', life: 3000 });
        } catch (error) {
            console.error('Erreur lors du traitement de la requête', error);
            toast.current.show({ severity: 'error', summary: 'Oops', detail: 'Erreur lors du traitement de la requête', life: 5000 });
        }
    };

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

    const handleProfilePictureUpload = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('image', imgInput.current.files[0]);
        
        try {
            await axios.put('/users/update_profile_picture/', formData, {
                headers: {
                    'Authorization': `Bearer ${token.access}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Photo de profil mise à jour avec succès', life: 3000 });
            fetchUserData(id);  // Refresh user data to show updated profile picture
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo de profil', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la mise à jour de la photo de profil', life: 5000 });
        }
    };

    const handleDeleteProfilePicture = async () => {
        try {
            await axios.delete('/users/delete_profile_picture/', {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Photo de profil supprimée avec succès', life: 3000 });
            fetchUserData(id);  // Refresh user data to show default profile picture
        } catch (error) {
            console.error('Erreur lors de la suppression de la photo de profil', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression de la photo de profil', life: 5000 });
        }
    };

    const handleDeleteUser = async () => {
        try {
            await axios.delete(`/users/delete/${id}/`, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Compte supprimé avec succès', life: 3000 });
            const dispatch = useDispatch();
            dispatch(clearAuth());
            setShowDeleteModal(false);
            router.push('/');
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la suppression du compte utilisateur', life: 5000 });
        }
    };

    if (!userData || !profile || !permissions) {
        return <div style={{ position: "relative", left: "40%", top: "40%" }}><ProgressSpinner /></div>;
    }

    return (
        <div >
        <div className={styles.container_header}>
        <p className={styles.titre}><FaChevronRight />Les informations de l'utilisateur  : <strong>{userData?.username}</strong></p>
    </div>
        <div className={styles.container}>
            <Toast ref={toast} />
            <div className={styles.profile_container}>
                <img src={userData.img_url ?`http://${window.location.host.split(":")[0]}:8000${userData.img_url}`:"/img-profile.jpg"} alt="User Avatar" width="200px" className={styles.user_avatar} />
                <div className={styles.icon_group}>
                    <FaUpload className={styles.icon}  onClick={() => {if( profile.id === parseInt(id)){imgInput.current.click()}else{setShowNotPermitModal(true); console.log(profile.id, id);}}} />
                    <input type='file' ref={imgInput} style={{ display: 'none' }} onChange={handleProfilePictureUpload} />
                    <FaTrash className={styles.icon} onClick={()=> {if( profile.id === parseInt(id)){handleDeleteProfilePicture();console.log("click()");}else{setShowNotPermitModal(true);}}} />
                </div>
                <Button className={styles.button} onClick={()=>{if (userHasPermitTo(permissions, 12)|| (profile.is_superuser)){router.push("/admin/users/groups/"+id+"/")}else{setShowNotPermitModal(true)}}} >Voir ses groupes</Button>
                <Button className={styles.button} onClick={()=>{if (userHasPermitTo(permissions, 15) || (profile.is_superuser)){router.push("/admin/users/permissions/"+id+"/")}else{setShowNotPermitModal(true)}}} >Voir ses permissions</Button>
            </div>

            <div className={styles.user_info}>
                <TabView>
                    <TabPanel header="Informations personnelles">
                        <div>
                            <p className={styles.user_inf}><strong>Nom:</strong>  <span className={styles.inf}>{userData.last_name}</span></p>
                            <p  className={styles.user_inf}><strong>Prénom:</strong> <span className={styles.inf}>{userData.first_name}</span></p>
                            <p  className={styles.user_inf}><strong>Email:</strong>  <span className={styles.inf}>{userData.email}</span></p>
                        </div>
                            <Button style={{marginTop:"40px", marginLeft:"200px", marginBottom:"80px"}} className={styles.button} onClick={() => {if (userHasPermitTo(permissions, 2) || (profile.is_superuser)){setShowDeleteModal(true)}else{setShowNotPermitModal(true)}}}>Supprimer mon compte</Button>
                    </TabPanel>
                </TabView>

                <TabView>
                    <TabPanel header="Informations de Connexion">   
                        <div>
                            <p className={styles.user_inf}><strong>Nom d'utilisateur:</strong> <span className={styles.inf}>{userData.username}</span></p>
                            <p className={styles.user_inf}><strong>Dernière date de connexion:</strong> <span className={styles.inf}> {userData.last_login}</span></p>
                        </div>
                    </TabPanel>

                    <TabPanel header="Changer le mot de passe" disabled>
                        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                            <h2 className={styles.h2}>Veuillez remplir ces champs</h2>
                            <div className={styles.formGroup}>
                                <span className="p-float-label">
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <Password
                                                id="password"
                                                {...field}
                                                className={styles.input}
                                                feedback={false}
                                                toggleMask
                                            />
                                        )}
                                    />
                                    <label htmlFor="password">Mot de passe Actuel</label>
                                </span>
                                {errors.password && <small className="p-error">{errors.password.message}</small>}
                            </div>
                            <div className={styles.formGroup}>
                                <span className="p-float-label">
                                    <Controller
                                        name="npassword"
                                        control={control}
                                        render={({ field }) => (
                                            <Password
                                                id="npassword"
                                                {...field}
                                                className={styles.input}
                                                feedback={false}
                                                toggleMask
                                            />
                                        )}
                                    />
                                    <label htmlFor="npassword">Nouveau Mot de passe</label>
                                </span>
                                {errors.npassword && <small className="p-error">{errors.npassword.message}</small>}
                            </div>
                            <div className={styles.formGroup}>
                                <span className="p-float-label">
                                    <Controller
                                        name="cpassword"
                                        control={control}
                                        render={({ field }) => (
                                            <Password
                                                id="confirmPassword"
                                                {...field}
                                                className={styles.input}
                                                feedback={false}
                                                toggleMask
                                            />
                                        )}
                                    />
                                    <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                                </span>
                                {errors.cpassword && <small className="p-error">{errors.cpassword.message}</small>}
                            </div>
                            <Button type="submit" className={styles.input} style={{ color: "#828282", fontWeight: "bold", fontSize: "15pt" }} label="Enregistrer" />
                        </form>
                    </TabPanel>
                </TabView>
            </div>
            <div className={styles.edit}>
                <button  onClick={()=>{if (userHasPermitTo(permissions, 4) || (profile.is_superuser)){router.push("/admin/users/update/"+ id)}else{setShowNotPermitModal(true)}} }  title="Editer les informations personnelles" style={{border:"none", backgroundColor:"white", color:"blue", marginTop:"55px", marginRight:"80px", cursor:"pointer"}} className="edit-button"><FaEdit /></button>
                <button style={{display:"none", border:"none", marginBottom:"150px", marginRight:"80px", color:"blue", backgroundColor:"white", cursor:"pointer"}} className="edit-button"><FaEdit /></button>
            </div>

            <Dialog header={
                <>
            <span style={{color:"red"}}><FaExclamationTriangle /> Alert</span>
                </>
            } visible={showNotPermitModal} style={{ width: '30vw' }} modal onHide={() => setShowNotPermitModal(false)}>
                <p>Vous n'etes pas autorisez à effectuer cette action !</p>
            </Dialog>

            <Dialog header={<><span><FaExclamationTriangle />  Confirmation de suppression </span></>} visible={showDeleteModal} style={{ width: '30vw' }} modal footer={
                <div className='btn_div'>
                    <Button className={styles.button} label="Non" icon="pi pi-times" onClick={() => setShowDeleteModal(false)}   />
                    <Button className={styles.button} label="Oui" icon="pi pi-check" onClick={handleDeleteUser} autoFocus />
                </div>
            } onHide={() => setShowDeleteModal(false)}>
                <p>Êtes-vous sûr de vouloir supprimer votre compte ?</p>
            </Dialog>
        </div>
        </div>
    );
};

export default UserDetails;
