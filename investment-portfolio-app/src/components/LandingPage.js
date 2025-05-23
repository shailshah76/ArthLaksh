import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Login from './Auth/Login';
import Signup from './Auth/Signup';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setIsLogin(true);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Section - Branding */}
        <div className="md:w-1/2 bg-blue-500 text-white flex flex-col justify-center items-center p-10">
          <h1 className="text-4xl font-bold mb-4">ArthLaksh</h1>
          <p className="text-lg text-center mb-6">Your Personal Investment Tracker</p>
          <img
            src="https://cdn-icons-png.flaticon.com/512/1907/1907553.png"
            alt="Investing"
            className="w-32 h-32"
          />
        </div>

        {/* Right Section - Auth Form */}
        <div className="md:w-1/2 p-10">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-4 py-2 rounded-l-md ${isLogin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-4 py-2 rounded-r-md ${!isLogin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Sign Up
            </button>
          </div>
          {isLogin ? <Login /> : <Signup />}
        </div>
      </div>
    </div>
  );
}
