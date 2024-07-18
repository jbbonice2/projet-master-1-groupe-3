"use client";
const AuthLayout = ({ children }) => {
    return (
      <div className="auth-layout p-d-flex p-ai-center p-jc-center" style={{ height: '100%' }}>
        <div className="p-shadow-3 p-p-4" style={{ backgroundColor: '#fff', borderRadius: '4px' }}>
          {children}
        </div>
      </div>
    );
  };
  
  export default AuthLayout;

  