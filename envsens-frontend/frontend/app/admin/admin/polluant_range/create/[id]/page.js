"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from '../../../../../axiosConfig';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ChromePicker } from 'react-color';
import styles from './create.module.css';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import userHasPermitTo from '@/app/utils';

const schema = yup.object().shape({
    minValue: yup.string().required("minValue est requis"),
    maxValue: yup.string().required("maxValue est requise"),
    display_color: yup.string().required("displaycolor est requis"),
    quality: yup.string().required("quality est requis"),
    isMaxValueInclude: yup.string().required("isMaxValueInclude est requis")
});

const CreatePolluantRange = () => {
    const [showNotPermitViewModal, setShowNotPermitViewModal] = useState(false);
    const [color, setColor] = useState("#fff");
    const [isMaxValueInclude, setIsMaxValueInclude] = useState(false);
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const router = useRouter();
    const toast = useRef(null);
    const { id } = useParams();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { token, profile, permissions } = useSelector(state => state.auth);

    const handleColorChange = (color) => {
        setColor(color.hex);
        setValue('display_color', color.hex);
    };

    const onSubmit = async (data) => {
        data['isMaxValueInclude'] = isMaxValueInclude === "Non" ? false : true;
        try {
            await axios.post(`/admins/pollutants/create_polluant_range/${id}/ranges/`, data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'PolluantRange créé avec succès', life: 3000 });
            setTimeout(() => router.push(`/admin/admin/polluant_range/list/${id}`), 1000);
        } catch (error) {
            console.error('Erreur lors de la création du polluantrange', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création du polluantrange', life: 3000 });
        }
    };

    useEffect(() => {
        if (!(profile.is_superuser || userHasPermitTo(permissions, 49)) ) {
            setShowNotPermitViewModal(true);
        }
    }, [profile]);

    const isMaxValueIncludeOptions = [
        { label: 'Oui', value: true },
        { label: 'Non', value: false }
    ];

    return (
        <div>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Ajout d'un polluantrange :</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Veuillez entrer les informations du nouveau polluantrange</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <InputText id="minValue" {...register('minValue')} placeholder="minValue du polluant .." className={styles.input} />
                        {errors.minValue && <small className={styles.error}>{errors.minValue.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="maxValue" {...register('maxValue')} placeholder="maxValue du polluant .." className={styles.input} />
                        {errors.maxValue && <small className={styles.error}>{errors.maxValue.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Dropdown id="isMaxValueInclude" {...register('isMaxValueInclude')} options={isMaxValueIncludeOptions} onChange={(e)=>setIsMaxValueInclude(e.target.value)}  value={isMaxValueInclude} placeholder="Inclure maxValue dans la plage ?" className={styles.input} />
                        {errors.isMaxValueInclude && <small className={styles.error}>{errors.isMaxValueInclude.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <InputText id="quality" {...register('quality')} placeholder="quality du polluant .." className={styles.input} />
                        {errors.quality && <small className={styles.error}>{errors.quality.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <Button type="button" className={styles.colorButton} onClick={() => setDisplayColorPicker(!displayColorPicker)} style={{ backgroundColor: color }}>
                            Choisir la couleur
                        </Button>
                        {displayColorPicker && (
                            <div className={styles.colorPicker}>
                                <ChromePicker color={color} onChangeComplete={handleColorChange} />
                            </div>
                        )}
                        <InputText id="display_color" value={color} readOnly className={styles.input} />
                        {errors.display_color && <small className={styles.error}>{errors.display_color.message}</small>}
                    </div>
                    <Button type="submit" className={styles.submitButton} label="Enregistrer" />
                </form>
            </div>

            <Dialog header={<>
                <span style={{ color: "red" }}><FaExclamationTriangle /> Alert</span>
            </>} visible={showNotPermitViewModal} style={{ width: '30vw' }} modal onHide={() => { setShowNotPermitViewModal(false); router.back() }}>
                <p>Vous n'avez pas accès à cette page !</p>
            </Dialog>
        </div>
    );
};

export default CreatePolluantRange;
