import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import axios from '@/app/axiosConfig';
import { useSelector } from 'react-redux';

const CountryForm = ({ country, onSuccess , onError}) => {
    const { register, handleSubmit, setValue } = useForm();
    const { token } = useSelector(state => state.auth);

    useEffect(() => {
        console.log(country);
        if (country) {
            setValue('code', country.code);
            setValue('name', country.name);
            setValue('description', country.description);
        }
    }, [country, setValue]);

    const onSubmit = async (data) => {
        try {
            if (country) {
                await axios.put(`/country/${country.id}/`, data, {
                    headers: {
                        'Authorization': `Bearer ${token.access}`
                    }
                });
            } else {
                await axios.post('/country/', data, {
                    headers: {
                        'Authorization': `Bearer ${token.access}`
                    }
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du pays', error);
            onError();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}  style={{ width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', marginTop:"40px" }}>
            <div className="p-field" style={{display: 'flex', flexDirection: 'row', alignItems: 'center',justifyContent:"space-between" ,  gap: '10px'}} >
                <label htmlFor="code">Code</label>
                <InputText className='input'  id="code" {...register('code')} />
            </div>
            <div className="p-field" style={{display: 'flex', flexDirection: 'row', alignItems: 'center',justifyContent:"space-between" , gap: '10px'}}>
                <label htmlFor="name">Nom</label>
                <InputText className='input'  id="name" {...register('name')} />
            </div>
            <div className="p-field" style={{display: 'flex', flexDirection: 'row', alignItems: 'center',justifyContent:"space-between", gap: '10px' }}>
                <label htmlFor="description">Description</label>
                <InputTextarea className='input' id="description" {...register('description')} />
            </div>
            <Button label="Sauvegarder" className='button' icon="pi pi-check" />
        </form>
    );
};

export default CountryForm;
