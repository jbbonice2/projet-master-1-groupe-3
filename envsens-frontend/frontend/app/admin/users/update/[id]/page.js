"use client"
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '@/app/axiosConfig';
import { FaBackspace, FaEdit, FaTrash, FaUpload } from 'react-icons/fa';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import styles from './id.module.css';
import { InputText } from 'primereact/inputtext';
import userHasPermitTo from '@/app/utils';

// Définir le schéma de validation avec Yup
const schemaPassword = yup.object().shape({
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

const schemaInfo = yup.object().shape({
    first_name: yup.string().required("Nom est requis"),
    last_name: yup.string().required("Prénom est requis"),
    email: yup.string().required("Email est requis")
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "L'adresse mail entrée n'est pas valide !"),
});

const UserDetails = () => {
    const router = useRouter();
    const { id } = useParams();;
    const { token, profile, permissions } = useSelector(state => state.auth);
    const toast = useRef(null);
    const [userData, setUserData] = useState(null);
    const { control, handleSubmit:handleSubmitInf, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schemaInfo)
    });

    const { control: controlPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors } } = useForm({
        resolver: yupResolver(schemaPassword)
    });
    useEffect(() => {
        if (id) {
            if (userHasPermitTo(permissions, 11) || profile.is_superuser) {
                fetchUserData(id);
            } else {
                setShowNotPermitModal(true);
            }
        }
    }, [id]);

    const onSubmitPassword = async (data) => {
        try {
            await axios.put('/users/change-password/', data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Mot de passe changé avec succès', life: 3000 });
        } catch (error) {
            console.error('Erreur lors du traitement de la requête', error);
            toast.current.show({ severity: 'error', summary: 'Oops', detail: 'Erreur lors du traitement de la requête: ' + error.code === "", life: 5000 });
        }
    };

    const onSubmitInf = async (data) => {
        try {
            await axios.put(`/users/update/${id}/`, data, {
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
            Object.keys(response.data).forEach(key => {
                setValue(key, response.data[key]);
              });
        }).catch((err) => {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        });
    };

    if (!userData) {
        return <div style={{ position: "relative", left: "40%", top: "40%" }}><ProgressSpinner /></div>;
    }

    return (
        <>
        <div className={styles.header}>
            <div className={styles.title}>
                <h3 style={{marginLeft:"15px"}}> 
                   <i className='pi pi-angle-right'></i> Mise a jours des informations de l'utilisateur 
                </h3>
                <button onClick={()=> router.push("/admin/users/"+ id)}  title="Retour" style={{ border:"none", backgroundColor:"white", color:"blue", backgroundColor:"initial", cursor:"pointer", marginRight:"15px"}} className="edit-button"><i className="pi pi-arrow-left" style={{ fontSize: '1rem' }}></i></button>

            </div>
           
        </div>

        <div className={styles.container}>
            <Toast ref={toast} />
            <div className={styles.profile_container}>
                <img src="/img-profile.jpg" alt="User Avatar" width="200px" className={styles.user_avatar} />
                <div className={styles.icon_group}>
                    <FaUpload className={styles.icon} />
                    <FaTrash className={styles.icon} />
                </div>
                <Button className={styles.button} onClick={() => { if (userHasPermitTo(permissions, 12) || profile.is_superuser) { router.push("/admin/users/groups/" + id + "/") } else { setShowNotPermitModal(true); } }}>Voir ses groupes</Button>
                <Button className={styles.button} onClick={() => { if (userHasPermitTo(permissions, 15) || profile.is_superuser) { router.push("/admin/users/permissions/" + id + "/") } else { setShowNotPermitModal(true); } }}>Voir ses permissions</Button>

            </div>

            <div className={styles.user_info}>
                <TabView>
                    <TabPanel header="Informations personnelles">
                        <form onSubmit={handleSubmitInf(onSubmitInf)}>
                        <div className={styles.inp_cont}>
                                <strong>Nom:</strong>
                                <div  style={{display:"flex", flexDirection:"column", justifyContent:"start"}}>
                                    <Controller
                                        name="last_name"
                                        control={control}
                                        render={({ field }) => (
                                            <InputText {...field} className={styles.inp} />
                                        )}
                                    />
                                    {errors.last_name && <small className="p-error">{errors.last_name.message}</small>}
                                </div>
                            </div>
                            <div  className={styles.inp_cont}>
                                <strong>Prénom:</strong>
                                <div style={{display:"flex", flexDirection:"column", justifyContent:"start"}}>
                                    <Controller
                                        name="first_name"
                                        control={control}
                                        render={({ field }) => (
                                            <InputText {...field} className={styles.inp} />
                                        )}
                                    />
                                    {errors.first_name && <small className="p-error">{errors.first_name.message}</small>}
                                </div>
                            </div>
                            <div  className={styles.inp_cont}>
                                <strong>Email:</strong>
                                <div style={{display:"flex", flexDirection:"column", justifyContent:"start"}}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        render={({ field }) => (
                                            <InputText {...field} className={styles.inp} />
                                        )}
                                    />
                                    {errors.email && <small className="p-error">{errors.email.message}</small>}
                                </div>
                            </div>
                            <Button style={{marginTop:"40px", marginLeft:"200px", marginBottom:"80px"}} type='submit' className={styles.button}>Enregistrer</Button>
                        </form>
                    </TabPanel>
                </TabView>

                <TabView>
                    <TabPanel header="Informations de Connexion">
                        <div>
                            <p className={styles.user_inf}><strong>Nom d'utilisateur:</strong> <span className={styles.inf}>{userData.username}</span></p>
                            <p className={styles.user_inf}><strong>Dernière date de connexion:</strong> <span className={styles.inf}> {userData.last_login}</span></p>
                        </div>
                    </TabPanel>

                    <TabPanel header="Changer le mot de passe">
                        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className={styles.form2}>
                            <h2 className={styles.h2}>Veuillez remplir ces champs</h2>
                            <div className={styles.btnContainer}>
                            <div className={styles.formGroup}>
                                <span className="d-flex">
                                    <Controller
                                        name="password"
                                        control={controlPassword}
                                        render={({ field }) => (
                                            <Password
                                                id="password"
                                                {...field}
                                                className={styles.inps1}
                                                feedback={false}
                                                toggleMask
                                                placeholder='Mot de passe Actuel'
                                            />
                                        )}
                                    />
                                </span>
                                {passwordErrors.password && <small className="p-error">{passwordErrors.password.message}</small>}
                            </div>
                            <div className={styles.formGroup}>
                                <span className={styles.span}>
                                    <Controller
                                        name="npassword"
                                        control={controlPassword}
                                        render={({ field }) => (
                                            <Password
                                                id="npassword"
                                                {...field}
                                                className={styles.inps1}
                                                feedback={false}
                                                toggleMask
                                                placeholder='Nouveau Mot de passe'
                                            />
                                        )}
                                    />
                                </span>
                                {passwordErrors.npassword && <small className="p-error">{passwordErrors.npassword.message}</small>}
                            </div>
                            <div className={styles.formGroup}>
                                <span className={styles.span}>
                                    <Controller
                                        name="cpassword"
                                        control={controlPassword}
                                        render={({ field }) => (
                                            <Password
                                                id="cpassword"
                                                {...field}
                                                className={styles.inps1}
                                                feedback={false}
                                                placeholder='Confirmer le Nouveau Mot de passe'
                                                toggleMask
                                            />
                                        )}
                                    />
                                </span>
                                {passwordErrors.cpassword && <small className="p-error">{passwordErrors.cpassword.message}</small>}
                            </div>
                            </div>
                            <Button type="submit" className={styles.inp} style={{ marginLeft:"80px", color: "#828282", fontWeight: "bold", fontSize: "15pt" }} label="Enregistrer" />
                        </form>
                    </TabPanel>
                </TabView>
            </div>
            <div className={styles.edit}>
                <button onClick={()=> router.push("/admin/users/"+ id)}  title="Retour" style={{ display:"none", border:"none", backgroundColor:"white", color:"blue", marginTop:"55px", marginRight:"80px", cursor:"pointer"}} className="edit-button"><i className="pi pi-arrow-left" style={{ fontSize: '1rem' }}></i></button>
                <button style={{display:"none", border:"none", marginBottom:"150px", marginRight:"80px", color:"blue", backgroundColor:"white", cursor:"pointer"}} className="edit-button"><FaEdit /></button>
            </div>
        </div>
        </>
    );
};

export default UserDetails;
