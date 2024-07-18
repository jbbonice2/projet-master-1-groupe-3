import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="p-d-flex">
      <Sidebar />
      <div style={{ flexGrow: 1 }}>
        <Navbar />
        <main className="p-p-3">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
