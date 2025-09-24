import React from 'react';

const AppTest = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🚀 React Test App</h1>
      <p style={{ color: '#666' }}>If you can see this, React is working correctly!</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('Button works! React hooks are functional.')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test React Hooks
        </button>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
        <h3>Debug Info:</h3>
        <p>React Version: {React.version}</p>
        <p>Current Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AppTest;
