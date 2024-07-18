"use client";
import React,{ useEffect, useRef ,useState}  from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useParams, useRouter } from 'next/navigation';
import styles from './create.module.css';
import { FaChevronRight } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import axios from '@/app/axiosConfig';
import { ProgressSpinner } from 'primereact/progressspinner';


// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    label: yup.string().required("Label est requis"),
    description: yup.string().required("Description est requise"),
});

const UpdateGroup = () => {
    const router = useRouter();
    const toast = useRef(null);
    const [groupData, setGroupData] = React.useState(null);
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const token = useSelector(state => { return state.auth.token});
    const {id} = useParams();


    // if (!groupData) {
    //     return <div style={{ position: "relative", left: "40%", top: "40%" }}><ProgressSpinner /></div>;
    // }
    const fetchGroupData = async (groupId) => {
        await axios.get(`/groups/detail/${groupId}/`, {
            headers: {
                "Authorization": "Bearer " + token.access
            }
        }).then((response) => {
            setGroupData(response.data);
            Object.keys(response.data).forEach(key => {
                setValue(key, response.data[key]);
              });
        }).catch((err) => {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        });
    };
    const onSubmit = async (data) => {
        try {
            await axios.put('/groups/update/'+id+'/', data,

            {headers: {
                    'Authorization':`Bearer ${token.access}`
        }})
        toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Mise à jour reussie !!', life: 3000 });
        // Redirection vers la liste des utilisateurs après le succès de la création
        setTimeout(() => router.push('/admin/groupes/'+id), 1000);
        } catch (error) {
            console.error('Erreur lors de la création du groupe', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour des information du groupe du groupe', life: 3000 });
        }
    };

    useEffect(()=>{
        if(parseInt(id) && groupData == null){
            fetchGroupData(id);
        }
    })

    return (
        <div>
            <div className={styles.container_header}>
            <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Mise à jour des informations du  groupe : {groupData?.label}</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Informarions du groupe</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <div className={styles.divflex}>  
                        <span className={styles.span}>Label:</span>
                        <InputText id="label" {...register('label')} placeholder="label .." className={styles.input} />
                        </div>
                        {errors.label && <small className={styles.error}>{errors.label.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputTextarea id="description" {...register('description')} placeholder="Description du groupe .." className={styles.textarea} />
                        {errors.description && <small className={styles.error}>{errors.description.message}</small>}
                    </div>
                    <Button type="submit" className={styles.submitButton} label="Enregistrer" />
                </form>
            </div>
        </div>
    );
};

export default UpdateGroup;


