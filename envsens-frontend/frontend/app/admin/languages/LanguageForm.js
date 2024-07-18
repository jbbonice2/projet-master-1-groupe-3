import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';

const LanguageForm = ({ language, onSuccess, onerror }) => {
    const { register, handleSubmit, setValue } = useForm();
    const { token } = useSelector(state => state.auth);

    useEffect(() => {
        if (language) {
            setValue('label', language.label);
            setValue('code', language.code);
        }
    }, [language, setValue]);

    const onSubmit = async (data) => {
        try {
            if (language) {
                await axios.put(`/language/${language.id}/`, data, {
                    headers: {
                        'Authorization': `Bearer ${token.access}`
                    }
                });
            } else {
                await axios.post('/language/', data, {
                    headers: {
                        'Authorization': `Bearer ${token.access}`
                    }
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la langue', error);
            onerror();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}  style={{ width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px',  marginTop:"40px" }}>
            <div className="p-field" style={{display: 'flex', flexDirection: 'row', alignItems: 'center',justifyContent:"space-between" ,  gap: '10px'}}>
                <label htmlFor="label">Label</label>
                <InputText  className='input'id="label" {...register('label')} />
            </div>
            <div className="p-field" style={{display: 'flex', flexDirection: 'row', alignItems: 'center',justifyContent:"space-between" ,  gap: '10px'}}>
                <label htmlFor="code">Code</label>
                <InputText  className='input' id="code" {...register('code')} />
            </div>
            <Button label="Sauvegarder" className='button' icon="pi pi-check" />
        </form>
    );
};

export default LanguageForm;
