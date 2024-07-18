"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { clearAuth } from '../redux/slices/authSlice';
import axios from '../axiosConfig';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import LanguageForm from './languages/LanguageForm';
import CountryForm from './country/countryForm';
import { Toast } from 'primereact/toast';

import userHasPermitTo from '@/app/utils';

const AdminLayout = ({ children }) => {
    const [activeCollapse, setActiveCollapse] = useState(null);
    const [showCreateCountryDialog, setShowCreateCountryDialog] = useState(false);
    const [showCreateLanguageDialog, setShowCreateLanguageDialog] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { token, profile, permissions } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();

    const toast = useRef(null);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setShowDeleteModal(true);
                return;
            }

            try {
                const response = await axios.get('/users/token/verify/', {
                    headers: {
                        'Authorization': `Bearer ${token.access}`
                    }
                });

                if (response.status !== 200) {
                    throw new Error('Token invalide');
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du token', error);
                dispatch(clearAuth());
                router.push('/login');
            }
        };

        checkAuth();
    }, [token, router, dispatch]);

    const toggleCollapse = (collapse) => () => {
        setActiveCollapse(prevCollapse => prevCollapse === collapse ? null : collapse);
    };

    const redirect = (path) => {
        router.push(path);
    };

    const redirectLogin = () => {
        setShowDeleteModal(false);
        router.push("/login");
    };

    const redirectHome = () => {
        setShowDeleteModal(false);
        router.push("/");
    };

    return (
        <div className={styles.adminContainer}>
            <Toast ref={toast} />
            <aside className={styles.sidebar} style={{ backgroundColor: "#F2F2F2", display: "flex", flexDirection: "column" }}>
                <nav className={styles.nav}>
                    <ul style={{ position: "fixed", top: "5rem", width: "10rem" }}>
                        <li className={styles.navItem} onClick={() => redirect("/admin/")}>
                            <i className="pi pi-home" style={{ marginRight: '5px' }}></i> Dashboard
                        </li>
                        <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                        <li className={styles.navItem} style={{ color: window.location.pathname.includes("users") ? "blue" : '' }} onClick={toggleCollapse('users')}>
                            <i className="pi pi-users" style={{ marginRight: '5px' }}></i> Utilisateurs
                            {activeCollapse === 'users' ? <FaChevronDown style={{ color: '#333' }} /> : <FaChevronRight style={{ color: '#333' }} />}
                        </li>
                        {(activeCollapse === 'users' || window.location.pathname.includes("users")) && (
                            <>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/users/list" ? 'blue' : 'black' }}
                                    onClick={() => { userHasPermitTo(permissions, 5) || profile.is_superuser ? redirect("/admin/users/list") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                                </li>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/users" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 1) || profile.is_superuser ? redirect("/admin/users") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                                </li>
                            </>
                        )}
                        <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                        <li className={styles.navItem} onClick={toggleCollapse('groups')}>
                            <i className="pi pi-th-large" style={{ marginRight: '5px' }}></i> Groupes
                            {activeCollapse === 'groups' ? <FaChevronDown /> : <FaChevronRight />}
                        </li>
                        {activeCollapse === 'groups' && (
                            <>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/groupes/list" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 19) || profile.is_superuser ? redirect("/admin/groupes/list") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                                </li>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/groupes" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 18) || profile.is_superuser ? redirect("/admin/groupes") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                                </li>
                            </>
                        )}
                        <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                        <li className={styles.navItem} onClick={toggleCollapse('countries')}>
                            <i className="pi pi-globe" style={{ marginRight: '5px' }}></i> Pays
                            {activeCollapse === 'countries' ? <FaChevronDown /> : <FaChevronRight />}
                        </li>
                        {activeCollapse === 'countries' && (
                            <>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/countries" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 28) || profile.is_superuser ? redirect("/admin/country") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                                </li>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/countries" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 25) || profile.is_superuser ? setShowCreateCountryDialog(true) : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                                </li>
                            </>
                        )}
                        <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                        <li className={styles.navItem} onClick={toggleCollapse('cities')}>
                            <i className="pi pi-map-marker" style={{ marginRight: '5px' }}></i> Villes
                            {activeCollapse === 'cities' ? <FaChevronDown /> : <FaChevronRight />}
                        </li>
                        {activeCollapse === 'cities' && (
                            <>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/cities/list" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 36) || profile.is_superuser ? redirect("/admin/cities/list") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                                </li>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/countries" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 33) || profile.is_superuser ? redirect("/admin/cities") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                                </li>
                            </>
                        )}
                        <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                        <li className={styles.navItem} onClick={toggleCollapse('networks')}>
                            <i className="pi pi-sitemap" style={{ marginRight: '5px' }}></i> Réseaux
                            {activeCollapse === 'networks' ? <FaChevronDown /> : <FaChevronRight />}
                        </li>
                        {activeCollapse === 'networks' && (
                            <>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/networks/list" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 41) || profile.is_superuser ? redirect("/admin/networks/list") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                                </li>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/networks" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 37) || profile.is_superuser ? redirect("/admin/networks") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                                </li>
                            </>
                        )}
                        <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                        <li className={styles.navItem} onClick={toggleCollapse('languages')}>
                            <i className="pi pi-globe" style={{ marginRight: '5px' }}></i> Langues
                            {activeCollapse === 'languages' ? <FaChevronDown /> : <FaChevronRight />}
                        </li>
                        {activeCollapse === 'languages' && (
                            <>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/languages/list" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 32) || profile.is_superuser ? redirect("/admin/languages/list") : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                                </li>
                                <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/languages" ? 'blue' : '' }}
                                    onClick={() => { userHasPermitTo(permissions, 29) || profile.is_superuser ? setShowCreateLanguageDialog(true) : setShowNotPermitModal(true) }}
                                    className={styles.navItem}>
                                    <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                                </li>
                            </>
                        )}

                    <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />

                    <li className={styles.navItem} onClick={toggleCollapse('pollutants')}>
                        <i className="pi pi-cloud" style={{ marginRight: '5px' }}></i> Polluants
                        {activeCollapse === 'pollutants' ? <FaChevronDown /> : <FaChevronRight />}
                    </li>
                    {activeCollapse === 'pollutants' && (
                        <>
                            <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/polluants/list" ? 'blue' : '' }}
                                onClick={() => { userHasPermitTo(permissions, 24) || profile.is_superuser ? redirect("/admin/admin/list") : setShowNotPermitModal(true) }}
                                className={styles.navItem}>
                                <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                            </li>
                            <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/pollutants" ? 'blue' : '' }}
                                onClick={() => { userHasPermitTo(permissions, 21) || profile.is_superuser ? redirect("/admin/admin") : setShowNotPermitModal(true) }}
                                className={styles.navItem}>
                                <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                            </li>
                        </>
                    )}

                    <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                    <li className={styles.navItem} onClick={toggleCollapse('devices')}>
                        <i className="pi pi-mobile" style={{ marginRight: '5px' }}></i> Capteurs
                        {activeCollapse === 'devices' ? <FaChevronDown /> : <FaChevronRight />}
                    </li>
                    {activeCollapse === 'devices' && (
                        <>
                            <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/devices/list" ? 'blue' : '' }}
                                onClick={() => { userHasPermitTo(permissions, 53) || profile.is_superuser ? redirect("/admin/devices/list") : setShowNotPermitModal(true) }}
                                className={styles.navItem}>
                                <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                            </li>
                            <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/devices" ? 'blue' : '' }}
                                onClick={() => { userHasPermitTo(permissions, 55) || profile.is_superuser ? redirect("/admin/devices") : setShowNotPermitModal(true) }}
                                className={styles.navItem}>
                                <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                            </li>
                        </>
                    )}

                    <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                    <li className={styles.navItem} onClick={toggleCollapse('gateways')}>
                        <i className="pi pi-wifi" style={{ marginRight: '5px' }}></i> Passerelle
                        {activeCollapse === 'gateways' ? <FaChevronDown /> : <FaChevronRight />}
                    </li>
                    {activeCollapse === 'gateways' && (
                        <>
                            <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/gateways/list" ? 'blue' : '' }}
                                onClick={() => { userHasPermitTo(permissions, 63) || profile.is_superuser ? redirect("/admin/gateways/list") : setShowNotPermitModal(true) }}
                                className={styles.navItem}>
                                <i className="pi pi-list" style={{ marginRight: '5px' }}></i> Liste
                            </li>
                            <li style={{ paddingLeft: '50%', color: window.location.pathname === "/admin/gateways" ? 'blue' : '' }}
                                onClick={() => { userHasPermitTo(permissions, 65) || profile.is_superuser ? redirect("/admin/gateways") : setShowNotPermitModal(true) }}
                                className={styles.navItem}>
                                <i className="pi pi-plus" style={{ marginRight: '5px' }}></i> Ajout
                            </li>
                        </>
                    )}

                    <hr style={{ border: '1px solid #ccc', borderWidth: 0.5 }} />
                    </ul>
                </nav>
                <footer className={styles.footer}>
                    <div className={styles.profileInfo}>
                        <i className="pi pi-user" style={{ marginRight: '5px' }}></i>
                        <span>{profile ? profile.username : 'Invité'}</span>
                    </div>
                    <Button style={{position:"fixed", bottom:"4.3rem"}} icon="pi pi-sign-out" label="Déconnexion" onClick={() => { dispatch(clearAuth()); router.push('/login'); }} />
                </footer>
            </aside>
            <main className={styles.mainContent}>
                {children}
            </main>

            <Dialog header="Créer un pays" visible={showCreateCountryDialog} style={{ width: '50vw' }} onHide={() => setShowCreateCountryDialog(false)}>
                <CountryForm />
            </Dialog>
            <Dialog header="Créer une langue" visible={showCreateLanguageDialog} style={{ width: '50vw' }} onHide={() => setShowCreateLanguageDialog(false)}>
                <LanguageForm />
            </Dialog>
            <Dialog header="Session expirée" visible={showDeleteModal} style={{ width: '50vw' }} onHide={() => setShowDeleteModal(false)}>
                <p>Votre session a expiré. Veuillez vous reconnecter.</p>
                <Button label="Se connecter" onClick={redirectLogin} />
                <Button label="Retour à l'accueil" onClick={redirectHome} />
            </Dialog>
        </div>
    );
};

export default AdminLayout;
