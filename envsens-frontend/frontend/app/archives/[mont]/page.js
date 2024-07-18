"use client";
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { useRouter, useParams } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import axios from '@/app/axiosConfig';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import styles from './id.module.css';

const PollutantArchiveDetail = () => {
    const [data, setData] = useState({});
    const [exportOptions, setExportOptions] = useState(null);
    const toast = useRef(null);
    const router = useRouter();
    const { mont } = useParams();
    const month = mont.split("-")[0];
    const year = mont.split("-")[1];

    const exportTypes = [
        { label: 'Export as XLSX', value: 'xlsx' },
        { label: 'Export as PDF', value: 'pdf' },
        { label: 'Export as CSV', value: 'csv' }
    ];

    useEffect(() => {
        getPollutantRecords();
    }, [year, month]);

    const getPollutantRecords = async () => {
        try {
            const response = await axios.get(`/pollutant-records/${year}/${month}/`);
            setData(response.data);
        } catch (error) {
            console.log(error);
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des enregistrements', life: 3000 });
        }
    };

    const exportData = (type, pollutantId) => {
        const records = data[pollutantId].records;
        const name = data[pollutantId].name;
        const unit = data[pollutantId].unit;
        const exportDate = new Date().toLocaleDateString('fr-FR');

        switch (type) {
            case 'xlsx':
                exportAsXLSX(records, name, unit);
                break;
            case 'pdf':
                exportAsPDF(records, name, unit, exportDate);
                break;
            case 'csv':
                exportAsCSV(records);
                break;
            default:
                break;
        }
    };

    const exportAsXLSX = (records, name, unit) => {
        const worksheet = XLSX.utils.json_to_sheet(records);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');
        XLSX.writeFile(workbook, `${name}_${unit}.xlsx`);
    };

    const exportAsPDF = (records, name, unit, exportDate) => {
        const doc = new jsPDF();
        doc.text(`Exportation des données - ${name}`, 10, 10);
        doc.text(`Unité: ${unit}`, 10, 20);
        doc.text(`Date d'exportation: ${exportDate}`, 10, 30);
        doc.autoTable({
            head: [['Num', 'Date', 'Value', 'Latitude', 'Longitude']],
            body: records.map((record, index) => [
                index + 1,
                new Date(record.timestamp_device).toLocaleString('fr-FR'),
                record.value,
                record.latitude,
                record.longitude
            ]),
            startY: 40,
        });
        doc.save(`${name}_${unit}.pdf`);
    };

    const exportAsCSV = (records) => {
        const csvData = records.map(record => ({
            Num: record.sequence_number,
            Date: new Date(record.timestamp_device).toLocaleString('fr-FR'),
            Value: record.value,
            Latitude: record.latitude,
            Longitude: record.longitude
        }));

        const csvContent = "data:text/csv;charset=utf-8," + [
            ['Num', 'Date', 'Value', 'Latitude', 'Longitude'],
            ...csvData.map(record => [
                record.Num,
                record.Date,
                record.Value,
                record.Latitude,
                record.Longitude
            ])
        ].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "export.csv");
        document.body.appendChild(link);
        link.click();
    };

    const indexTemplate = (rowData, options) => {
        return options.rowIndex + 1;
    };

    const dateTemplate = (rowData) => {
        return new Date(rowData.timestamp_device).toLocaleString('fr-FR');
    };

    return (
        <>
            <Toast ref={toast} />
            <div style={{marginTop:"4rem", padding:"2rem"}}>
                <h2>Enregistrements pour {`${month}/${year}`}</h2>
                {Object.keys(data).map((pollutantId) => (
                    <div  key={pollutantId}  style={styles.btn_div}>
                        <div className='btn_div' >
                            <h3 style={{marginLeft:"3rem"}}>Nom : <strong>{data[pollutantId].name}</strong>, en {data[pollutantId].unit} {pollutantId}</h3>
                            <Dropdown 
                                value={exportOptions}
                                options={exportTypes}
                                onChange={(e) => exportData(e.value, pollutantId)}
                                placeholder="Select Export Type"
                                style={{ width: '200px', marginBottom: '1rem' }}
                            />
                        </div>
                        <DataTable value={data[pollutantId].records} paginator rows={10} className="p-datatable-gridlines">
                            <Column body={indexTemplate} header="Num" sortable />
                            <Column body={dateTemplate} header="Date" sortable />
                            <Column field="value" header="Value" sortable />
                            <Column field="latitude" header="Latitude" sortable />
                            <Column field="longitude" header="Longitude" sortable />
                        </DataTable>
                    </div>
                ))}
            </div>
        </>
    );
};

export default PollutantArchiveDetail;
