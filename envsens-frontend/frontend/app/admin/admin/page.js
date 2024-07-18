 "use client";
import React,{ useEffect, useRef, useState }  from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '../../axiosConfig';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useRouter } from 'next/navigation';
import styles from './create.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';


// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    name: yup.string().required("nom est requis"),
    description: yup.string().required("Description est requise"),
    //code: yup.string().required("nom est requis"),
    unit: yup.string().required("unit est requis"),

});

const CreatePolluant= () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const router = useRouter();
    const toast = useRef(null);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const {token, profile} = useSelector(state => { return state.auth});

    const onSubmit = async (data) => {
        try {
            await axios.post('/admins/pollutants/create/', data,

            {headers: {
                    'Authorization':`Bearer ${token.access}`
        }})
        toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Polluant créé avec succès', life: 3000 });
        // Redirection vers la liste des utilisateurs après le succès de la création
        setTimeout(() => router.push('/admin/admin/list'), 1000);
        } catch (error) {
            console.error('Erreur lors de la création du groupe', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création du polluant', life: 3000 });
        }
    };

    useEffect(()=>{
        if(!(profile.is_superuser|| userHasPermitTo(permissions, 21)  )) {
            setShowNotPermitViewModal(true);
        }
    }, [profile, showNotPermitViewModal]);


    return (
        <div>
            <div className={styles.container_header}>
            <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Ajout d'un Polluant :</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations du nouveau polluant</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <InputText id="name" {...register('name')} placeholder="nom .." className={styles.input} />
                        {errors.name && <small className={styles.error}>{errors.name.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="unit" {...register('unit')} placeholder="unit .." className={styles.input} />
                        {errors.unit && <small className={styles.error}>{errors.unit.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputTextarea id="description" {...register('description')} placeholder="Description du polluant .." className={styles.textarea} />
                        {errors.description && <small className={styles.error}>{errors.description.message}</small>}
                    </div>
                    <Button type="submit" className={styles.submitButton} label="Enregistrer" />
                </form>
            </div>

            <Dialog header={<>
               <span style={{color:"red"}}><FaExclamationTriangle /> Alert</span>
                </>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => {setShowNotPermitViewModal(false); router.back()}}>
                <p>Vous n'avez pas access à cette page !</p>
            </Dialog>
        </div>
    );
};

export default CreatePolluant;
