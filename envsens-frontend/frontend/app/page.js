"use client"
import GraphComponent from "./components/GraphComponent";
// import { useTranslation } from 'react-i18next';

const HomePage = () => {
  // const { t } = useTranslation();
  return (
    <div style={{marginTop: "5rem" ,marginLeft: "1rem"}}>
      {/* <h1>{t('welcome')}</h1> */}
     <GraphComponent width={1480}/>
    </div>
  );
};

export default HomePage;
