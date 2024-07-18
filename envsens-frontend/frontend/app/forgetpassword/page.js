"use client"
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import axios from '@/app/axiosConfig';
import { Toast } from 'primereact/toast';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useRouter } from 'next/navigation';

const ForgetPassword = () => {
    const [email, setEmail] = useState('');
    const toast = React.useRef(null);
    const router = useRouter();

    const handleForgetPassword = async () => {
        try {
            const response = await axios.post('/users/forget_password/', { email });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Message sent successfully' });
            router.push("/VerifyResetPassword/");
            setEmail('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to send message' });
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="p-d-flex p-jc-center p-ai-center" style={{ height: '100vh' }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "41%",
                    width: "60%",
                    alignContent: "center",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    marginLeft: "20%",
                    marginTop: "13%",
                    paddingBottom: "2%"
                }}>
                    <h2>Mot de passe oublié</h2>
                    <div className="p-fluid p-formgrid p-grid">
                        <div className="p-field p-col">
                            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Entrer votre adresse email...' />
                        </div>
                    </div>
                    <div className="p-field p-3 -mb-1">
                        <Button label="Envoyer code" onClick={handleForgetPassword} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgetPassword;

