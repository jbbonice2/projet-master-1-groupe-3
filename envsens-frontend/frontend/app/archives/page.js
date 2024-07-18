"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useRouter } from 'next/navigation';
import axios from '@/app/axiosConfig';
import { Toast } from 'primereact/toast';
import styles from './id.module.css';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { FaEye } from 'react-icons/fa';

const PollutantArchiveList = () => {
    const [months, setMonths] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);
    const router = useRouter();

    useEffect(() => {
        getPollutantRecordMonths();
    }, []);

    const getPollutantRecordMonths = async () => {
        try {
            const response = await axios.get('/pollutant-record-months/');
            setMonths(response.data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des mois', life: 3000 });
        }
    };

    const header = (
        <div style={{ backgroundColor: "#FFFAFA" }}>
            <div className={styles.container_header}>
                <p className={styles.titre}>Liste des mois avec enregistrements</p>
            </div>
            <div className="table-header" style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}>
                <span className="p-input-icon-right" style={{ display: "flex", alignItems: "center" }}>
                    <InputText type="search" placeholder="Rechercher..." onInput={(e) => setGlobalFilter(e.target.value)} />
                    <i className="pi pi-search" style={{ position: 'absolute', right: '1rem' }} />
                </span>
            </div>
        </div>
    );

    const indexTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    const dateTemplate = (rowData) => {
        return new Date(rowData.month).toLocaleString('fr-FR', { year: 'numeric', month: 'long' });
    };

    const actionBodyTemplate = (rowData) => {
        const date = new Date(rowData.month);
        return (
            <Button
                icon={<FaEye />}
                onClick={() => router.push(`/archives/${date.getFullYear()}-${date.getMonth() + 1}`)}
                className="p-button-text"
            />
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-datatable p-component" style={{ height: '100vh', marginTop:"6rem" }}>
                <DataTable globalFilter={globalFilter} rowsPerPageOptions={[5, 10, 25, 50]} value={months} paginator rows={8} header={header} className="p-datatable-gridlines" style={{ height: 'calc(100vh - 145px)' }}>
                    <Column body={indexTemplate} header="Num" sortable />
                    <Column body={dateTemplate} header="Mois" sortable />
                    <Column field="record_count" header="Nombre d'enregistrements" sortable />
                    <Column body={actionBodyTemplate} header="Action" />
                </DataTable>
            </div>
        </>
    );
};

export default PollutantArchiveList;
