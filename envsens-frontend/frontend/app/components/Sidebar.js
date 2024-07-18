import { useTranslation } from 'react-i18next';
import Link from 'next/link';

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="p-d-flex p-flex-column p-shadow-3" style={{ width: '250px', backgroundColor: '#f4f4f4' }}>
      <Link href="/"className="p-mb-3 p-p-3 p-text-secondary">{t('home')}</Link>
      <Link href="/admin/users" className="p-mb-3 p-p-3 p-text-secondary">{t('users')}</Link>
      <Link href="/admin/groupes" className="p-mb-3 p-p-3 p-text-secondary">{t('groups')}</Link>
    </div>
  );
};

export default Sidebar;
