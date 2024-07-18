import { ProgressSpinner } from 'primereact/progressspinner';

const Loader = () => (
  <div className="p-d-flex p-jc-center p-ai-center" style={{ height: '100vh' }}>
    <ProgressSpinner />
  </div>
);

export default Loader;
