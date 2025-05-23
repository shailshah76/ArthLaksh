import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 

import PrivateRoute from './components/Auth/PrivateRoute';
import LandingPage from './components/LandingPage';
import MainApp from './MainApp'; // extracted your investment dashboard code into MainApp.js

function App() {

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<PrivateRoute><MainApp /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
