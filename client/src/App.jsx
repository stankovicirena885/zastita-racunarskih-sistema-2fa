import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TwoFAVerify from './pages/TwoFAVerify.jsx';
import Security from './pages/Security.jsx';
import Protected from './components/Protected.jsx';
import Navbar from './components/Navbar.jsx';

export default function App() {
  return (
    <div className='app'>
      <Navbar />
      <div className='container'>
        <Routes>
          <Route
            path='/'
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/2fa' element={<TwoFAVerify />} />
          <Route
            path='/security'
            element={
              <Protected>
                <Security />
              </Protected>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
