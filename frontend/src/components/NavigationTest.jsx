// Test Navigation Component
// Add this temporarily to your Dashboard to test navigation

import { useNavigate, useLocation } from "react-router-dom";

const NavigationTest = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const testNavigation = (path) => {
    console.log(`🧪 Testing navigation to: ${path}`);
    console.log("Current location:", location.pathname);
    
    try {
      navigate(path);
      console.log(`✅ Navigate called for: ${path}`);
    } catch (error) {
      console.error("❌ Navigation failed:", error);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid red', 
      marginBottom: '20px',
      backgroundColor: '#ffe6e6' 
    }}>
      <h3>🔧 Navigation Debug Panel</h3>
      <p><strong>Current Path:</strong> {location.pathname}</p>
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => testNavigation("/dashboard")}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
        
        <button 
          onClick={() => testNavigation("/pickups")}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Go to Pickups
        </button>
        
        <button 
          onClick={() => testNavigation("/pickups/create")}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Go to Create Pickup
        </button>
        
        <button 
          onClick={() => testNavigation("/wallet")}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Go to Wallet
        </button>
        
        <button 
          onClick={() => window.location.href = "/pickups"}
          style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ffd700' }}
        >
          Force Navigate (window.location)
        </button>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h4>localStorage Check:</h4>
        <pre style={{ fontSize: '12px', backgroundColor: 'white', padding: '10px' }}>
          {JSON.stringify({
            user: localStorage.getItem("user")?.slice(0, 50) + "...",
            token: localStorage.getItem("token")?.slice(0, 30) + "..."
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default NavigationTest;