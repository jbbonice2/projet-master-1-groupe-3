"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useParams, useRouter } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { ChromePicker } from 'react-color';
import styles from './create.module.css';
import { FaChevronRight } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Toast } from 'primereact/toast';
import axios from '@/app/axiosConfig';
import { ProgressSpinner } from 'primereact/progressspinner';

// Définir le schéma de validation avec Yup
const schema = yup.object().shape({
    minValue: yup.string().required("minValue est requis"),
    maxValue: yup.string().required("maxValue est requis"),
    display_color: yup.string().required("display color est requis"),
    quality: yup.string().required("quality est requis"),
    isMaxValueInclude: yup.boolean().required("isMaxValueInclude est requis")
});

const UpdatePolluantRange = () => {
    const router = useRouter();
    const toast = useRef(null);
    const [polluantRangeData, setPolluantRangeData] = useState(null);
    const [color, setColor] = useState("#fff");
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const token = useSelector(state => state.auth.token);
    const { polluant_id, id } = useParams();

    useEffect(() => {
        if (parseInt(id) && polluantRangeData == null) {
            fetchPolluantRangeData(id);
        }
    }, [id, polluantRangeData]);

    const fetchPolluantRangeData = async (rangeId) => {
        try {
            const response = await axios.get(`admins/pollutants/detail_polluant_range/${polluant_id}/ranges/${rangeId}/`, {
                headers: {
                    "Authorization": "Bearer " + token.access
                }
            });
            setPolluantRangeData(response.data);
            Object.keys(response.data).forEach(key => {
                setValue(key, response.data[key]);
                if (key === 'display_color') setColor(response.data[key]);
            });
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des informations', life: 3000 });
            console.log(err);
        }
    };

    const handleColorChange = (color) => {
        setColor(color.hex);
        setValue('display_color', color.hex);
    };

    const onSubmit = async (data) => {
        try {
            await axios.put(`admins/pollutants/update_polluant_range/${polluant_id}/ranges/${id}/`, data, {
                headers: {
                    'Authorization': `Bearer ${token.access}`
                }
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Mise à jour réussie !!', life: 3000 });
            setTimeout(() => router.push(`/admin/admin/polluant_range/list/${polluant_id}`), 1000);
        } catch (error) {
            console.error('Erreur lors de la mise à jour', error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour des informations du polluant range', life: 3000 });
        }
    };

    const isMaxValueIncludeOptions = [
        { label: 'Oui', value: true },
        { label: 'Non', value: false }
    ];

    return (
        <div>
            <div className={styles.container_header}>
                <Toast ref={toast} />
                <p className={styles.titre}><FaChevronRight /> Mise à jour des informations du polluant range : {polluantRangeData?.name}</p>
            </div>
            <div className={styles.container}>
                <h2 className={styles.title}>Informations du polluant range</h2>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.formGroup}>
                        <div className={styles.divflex}>
                            <span className={styles.span}>minValue:</span>
                            <InputText id="minValue" {...register('minValue')} placeholder="minValue..." className={styles.input} />
                        </div>
                        {errors.minValue && <small className={styles.error}>{errors.minValue.message}</small>}
                    </div>
                    <div className={styles.formGroup}>
                        <div className={styles.divflex}>
                            <span className={styles.span}>maxValue:</span>
                            <InputText id="maxValue" {...register('maxValue')} placeholder="maxValue..." className={styles.input} />
                        </div>
                        {errors.maxValue && <small className={styles.error}>{errors.maxValue.message}</small>}
                    </div>
                 
                    <div className={styles.formGroup}>
                    <div className={styles.divflex}>
                    <span className={styles.span}>display color:</span>
                    <div  className={styles.divflex1}>
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
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                    <div className={styles.divflex}>
                    <span className={styles.span}>isMaxValueInclude:</span>
                        <Controller
                            name="isMaxValueInclude"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="isMaxValueInclude"
                                    value={field.value}
                                    options={isMaxValueIncludeOptions}
                                    onChange={(e) => field.onChange(e.value)}
                                    placeholder="Inclure maxValue dans la plage ?"
                                    className={styles.input}
                                />
                            )}
                        />
                        {errors.isMaxValueInclude && <small className={styles.error}>{errors.isMaxValueInclude.message}</small>}
                    </div>
                    </div>
                    <div className={styles.formGroup}>
                        <div className={styles.divflex}>
                            <span className={styles.span}>quality:</span>
                            <InputText id="quality" {...register('quality')} placeholder="quality..." className={styles.input} />
                        </div>
                        {errors.quality && <small className={styles.error}>{errors.quality.message}</small>}
                    </div>

                    <Button type="submit" className={styles.submitButton} label="Enregistrer" />
                </form>
            </div>
        </div>
    );
};

export default UpdatePolluantRange;
