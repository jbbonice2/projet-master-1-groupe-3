"use client";
import GraphComponent from "../components/GraphComponent"

const AdminPage = () => {
  return (
    <div style={{marginTop: "5rem" ,marginLeft: "1rem" ,  display: 'flex', justifyContent: 'space-evenly'}}>
      {/* <h1>{t('welcome')}</h1> */}
     <GraphComponent width={1250}/>
    </div>
  );
};

export default AdminPage;
