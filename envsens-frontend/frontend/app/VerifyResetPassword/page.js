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

const VerifyResetPassword = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const toast = React.useRef(null);
    const router = useRouter();

    const handleVerifyResetPassword = async () => {
        try {
            const response = await axios.post('/users/verify_code_and_reset_password/', { email, code, new_password: newPassword });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Password reset successfully' });
            setCode('');
            setEmail('');
            setNewPassword('');
            router.push("/login");
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to reset password' });
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
                    height: "65%",
                    width: "60%",
                    alignContent: "center",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    marginLeft: "20%",
                    marginTop: "5%",
                    paddingBottom: "2%"
                }}>
                    <h2>Vérifier le code et réinitialiser le mot de passe</h2>
                    <div className="p-field">
                        <InputText id="email" value={email} placeholder="Entrer l'adresse e-mail ..." onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="p-field">
                        <InputText id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder='Entrer le code verification ...' />
                    </div>
                    <div className="p-field">
                        <InputText id="newPassword" type="password" value={newPassword} placeholder='Entrer le nouveau mot de passe ...' onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="p-field">
                        <Button label="Réinitialiser le mot de passe" onClick={handleVerifyResetPassword} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyResetPassword;

