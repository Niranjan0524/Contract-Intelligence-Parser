
import { useState } from 'react';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';

function App() {
  // Sample user data - in a real app, this would come from authentication
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Contract Analyst'
  });

  const [isLoggedIn] = useState(true); // For demo purposes, user is always logged in

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    console.log('Logout clicked');
    // You would typically:
    // - Clear authentication tokens
    // - Reset user state
    // - Redirect to login page
  };

  if (!isLoggedIn) {
    // This would typically be your login component
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          {/* Login form would go here */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="pt-16"> {/* pt-16 to account for fixed navbar */}
        <Layout>
          <Dashboard user={user} />
        </Layout>
      </div>
    </div>
  );
}

export default App;
