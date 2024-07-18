// pages/sendMessage.js
"use client"
import React, { useState } from 'react';
import axios from '@/app/axiosConfig';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import styles from './messages.module.css';

const SendMessage = () => {
    const [recipient, setRecipient] = useState('');
    const [user, setUser] = useState('');
    const [body, setBody] = useState('');
    const [subject, setSubject] = useState('');
    const [name, setName] = useState('');
    const toast = React.useRef(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const messageData = {
            recipient: 1, // Assume recipient is an ID provided by user input
            user,
            name,
            body,
            subject,
        };
        try {
            const response = await axios.post('admins/send_message/', messageData);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Message sent successfully' });
            setBody('');
            setName('');
            setSubject('');
            setUser('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to send message' });
        }
    };

    return (
        <div className={`${styles.sendMessageContainer} p-d-flex p-jc-center p-ai-center`}>
            
            <Toast ref={toast} />
            <form onSubmit={handleSubmit} className={`${styles.sendMessageForm} p-fluid p-card`}>
            <h2>Contacter l'administrateur</h2>
                <div className="p-field">
                    <label htmlFor="user">Email</label>
                    <InputText id="user" value={user} placeholder="Enter email address" onChange={(e) => setUser(e.target.value)} />
                </div>
                <div className="p-field">
                    <label htmlFor="name">Name</label>
                    <InputText id="name" value={name} placeholder="Enter name" onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="p-field">
                    <label htmlFor="subject">Subject</label>
                    <InputText id="subject" value={subject} placeholder="Enter subject" onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="p-field">
                    <label htmlFor="body">Message</label>
                    <InputTextarea id="body" placeholder="Enter message" value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
                </div>
                <Button type="submit" label="Send Message" />
            </form>
        </div>
    );
};

export default SendMessage;
