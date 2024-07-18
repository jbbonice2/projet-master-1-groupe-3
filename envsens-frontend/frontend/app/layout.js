"use client";
import './globals.css';
import styles from './layout.module.css';
import { FaBell, FaUser } from 'react-icons/fa';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { clearAuth } from './redux/slices/authSlice';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import axios from '@/app/axiosConfig';
import { googleLogout, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import CryptoJS from 'crypto-js';

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <head>
                <meta name="description" content='EnvSens Application' />
                <title>EnvSens</title>
            </head>
            <body>
                <GoogleOAuthProvider clientId="13549718784-2oa1s8n1jk5g41q05du4a2a6sgufikq3.apps.googleusercontent.com">
                    <Provider store={store}>
                        <PersistGate loading={null} persistor={persistor}>
                            <LayoutComponent>
                                {children}
                            </LayoutComponent>
                        </PersistGate>
                    </Provider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}

const getFormattedDate = () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const date = new Date();
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
};

const LayoutComponent = ({ children }) => {
    const profile = useSelector(state => state.auth.profile);
    const router = useRouter();
    const toast = useRef(null);
    const [visible, setVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const dispatch = useDispatch();
    const ENCRYPTION_KEY = 'your-encryption-key';

    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const decryptedData = CryptoJS.AES.decrypt(storedUserInfo, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
            const parsedData = JSON.parse(decryptedData);
            setUserInfo(parsedData);
            setIsLoggedIn(true);
        }
    }, []);

    useEffect(() => {
        // Gestionnaire d'événement pour fermer le dropdown lors d'un clic en dehors de celui-ci
        const handleClickOutside = (event) => {
            if (visible && !event.target.closest(`.${styles.userDropdown}`)) {
                setVisible(false);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [visible]);

    const handleLogout = () => {
        googleLogout();
        localStorage.removeItem('userInfo');
        setIsLoggedIn(false);
        dispatch(clearAuth());
        toast.current.show({ severity: 'success', summary: 'Déconnexion', detail: 'Vous avez été déconnecté.', life: 1000 });
        router.push("/");
    };

    const getUserInfo = (idToken) => {
        const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const userId = data.sub;
                const userName = data.name;
                const userEmail = data.email;
                const userPictureUrl = data.picture;
                const userInf = {
                    userPictureUrl: userPictureUrl,
                    userName: userName,
                    userEmail: userEmail
                };

                const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(userInf), ENCRYPTION_KEY).toString();

                localStorage.setItem('userInfo', encryptedData);
                setUserInfo(userInf);
                setIsLoggedIn(true);
                const donnees = {
                    token: idToken,
                    image: userPictureUrl,
                    email: userEmail,
                    nom: userName,
                    id: userId
                };
                axios.post("/users/create", donnees)
                    .then(res => {
                        console.log(res.data.message);
                    })
                    .catch(error => {
                        if (error?.response?.status !== 401) {
                            toast.current.show({ severity: 'error', summary: 'Oups !', detail: 'Un problème est survenu lors de la tentative connexion.', life: 1000 });
                            console.error("Quelque chose n'a pas marché dans le backend :", error.response.data);
                        }
                    });
            })
            .catch(error => {
                console.error("Une erreur s'est produite lors de la récupération des informations de l'utilisateur chez Google:", error);
            });
    };

    const userOptions = profile ? [
        { label: `${profile.first_name} ${profile.last_name}`, className: styles.dropdownHeader },
        { label: `${profile.username}`, className: styles.username },
        { label: 'Voir mon profil', command: () => { setVisible(!visible); router.push(`/admin/users/${profile.id}`) } },
        { label: 'Editer mon Profil', command: () => { setVisible(!visible); router.push(`/admin/users/update/${profile.id}`) } },
        { label: 'Paramètres', command: () => { setVisible(!visible); router.push(`/admin/users/update/${profile.id}`) } },
        { label: 'Déconnexion', command: () => { setVisible(!visible); handleLogout() } }
    ] : userInfo ? [
        { label: `${userInfo.userName}`, className: styles.dropdownHeader },
        { label: `${userInfo.userEmail}`, className: styles.username },
        { label: 'Déconnexion', command: () => { setVisible(!visible); handleLogout() } }
    ]:
    [
        { label: 'Anonymous User', className: styles.dropdownHeader },
        { label: 'Connexion', command: () => router.push("/login") }
    ];

    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        setCurrentDate(getFormattedDate());
    }, []);

    return (
        <div className={styles.container}>
            <Toast ref={toast} />
            <header className={styles.header}>
                <h1 style={{ cursor: "pointer" }} onClick={() => router.push("/")}>EnvSens</h1>
                <div className={styles.profileSection}>
                    <div className={styles.profiles}>
                        <Button className='btn p-mr-2 ' style={{ borderRadius: '25px' }} onClick={() => router.push("/archives")}>Archives</Button>
                        <FaBell className={styles.icon} />
                        <div className={styles.userDropdown}>
                            {profile ? (
                                <div style={{ marginLeft: "10px", marginRight: "5px" }}>
                                    <Avatar image={profile.img_url ? `http://${window.location.host.split(":")[0]}:8000${profile.img_url}` : "/img-profile.jpg"} onClick={() => setVisible(!visible)} style={{ cursor: "pointer" }} shape="circle" />
                                </div>
                            ) : (
                                <>
                                    {userInfo ? (
                                        <div style={{ marginLeft: "10px", marginRight: "5px" }}>
                                            <Avatar image={userInfo.userPictureUrl} onClick={() => setVisible(!visible)} style={{ cursor: "pointer" }} shape="circle" />
                                        </div>
                                    ) : (
                                        <FaUser className={styles.icon} onClick={() => setVisible(!visible)} style={{ cursor: "pointer" }} />
                                    )}
                                    {!isLoggedIn && (
                                        <Button className="p-button-outlined p-mr-2" label="Login" onClick={() => router.push("/login")} />
                                    )}
                                    {!isLoggedIn && (
                                        <GoogleLogin
                                            useOneTap
                                            onSuccess={(credentialResponse) => {
                                                getUserInfo(credentialResponse.credential);
                                            }}
                                            onError={() => {
                                                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Échec de la connexion Google', life: 3000 });
                                            }}
                                            className="p-button-outlined"
                                            style={{ marginLeft: '10px' }}
                                        />
                                    )}
                                </>
                            )}
                            {visible && (profile || userInfo) && (
                                <div className={styles.dropdownMenu}>
                                    {userOptions.map((option, index) => (
                                        <div key={index} className={option.className || styles.dropdownItem} onClick={option.command}>
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <h2 className={styles.date}>{currentDate}, Yaoundé, Centre, Cameroun </h2>
                </div>
            </header>
            <main className={styles.main}>
                {children}
            </main>
            <footer className={styles.footer}>
                <div className={styles.foot}>
                Copyright: UYI, Departement d'Informatique
                <a className={styles.navItem} href="/admin/messages/">
                    <Button
                        label="Contact"
                        icon="pi pi-envelope"
                        iconPos="left"
                        className="p-button-text"
                        style={{ marginRight: '100px', backgroundColor: '#0d89ec', color: 'white', border: 'none' }}
                    />
                </a>
               </div>
            </footer>
        </div>
    );
};
