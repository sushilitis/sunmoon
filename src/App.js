import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginSignup from './components/LoginSignup/LoginSignup';
import Home from './components/Home/Home';
import HomeScreen from './components/HomeScreen/HomeScreen';
import { Navbar } from './components/Navbar/Navbar';
import ChatState from './context/ChatState';

function App() {
  return (
    <>
      <ChatState>
        <BrowserRouter>
          {/* <Navbar /> */}
          <Routes>
            <Route path='/login' element={<LoginSignup />} />
            {/* <Route path='/*' element={<Home />} /> */}
            <Route path='/*' element={<HomeScreen />} />
          </Routes>
        </BrowserRouter>
      </ChatState>
    </>
  );
}

export default App;
