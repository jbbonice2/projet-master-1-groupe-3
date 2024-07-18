import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';




const Navbar = () => {
  const { t } = useTranslation();
 
  return (
    <div className="p-d-flex p-jc-between p-ai-center p-p-3 p-shadow-3" style={{ backgroundColor: '#007ad9', color: '#fff' }}>
      <div>
        <h2>EnvSens</h2>
      </div>
      <div className="p-d-flex p-ai-center">
        <Button label={t('logout')} icon="pi pi-sign-out" className="p-button-danger" onClick={()=>{}} />
      </div>
     
    </div>
  );
};

export default Navbar;
