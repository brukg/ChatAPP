import { useEffect, useLayoutEffect, useState } from "react";
import { Menu } from "./components";
import { Routes, Route } from "react-router-dom";
import { Error, Forgot, Login, Main, Signup } from "./page";
import { useSelector } from "react-redux";
import ProtectedRoute from "./protected";
import Loading from "./components/loading/loading";

const App = () => {
  const [offline, setOffline] = useState(!window.navigator.onLine);
  const [currentModel, setCurrentModel] = useState('deepseek_T');

  const { loading, user } = useSelector((state) => state);

  const changeColorMode = (to) => {
    if (to) {
      localStorage.setItem("darkMode", true);

      document.body.className = "dark";
    } else {
      localStorage.removeItem("darkMode");

      document.body.className = "light";
    }
  };

  // Dark & Light Mode
  useLayoutEffect(() => {
    let mode = localStorage.getItem("darkMode");

    if (mode) {
      changeColorMode(true);
    } else {
      changeColorMode(false);
    }
  });

  // Offline
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <section className={user ? "main-grid" : null}>
      {user && (
        <div>
          <Menu 
            changeColorMode={changeColorMode} 
            currentModel={currentModel}
            onModelChange={setCurrentModel}
          />
        </div>
      )}

      {loading && <Loading />}

      {offline && (
        <Error
          status={503}
          content={"Website in offline check your network."}
        />
      )}

      <Routes>
        <Route element={<ProtectedRoute offline={offline} authed={true} />}>
          <Route exact path="/" element={
            <Main 
              currentModel={currentModel} 
              setCurrentModel={setCurrentModel}
            />
          } />
          <Route path="/chat" element={
            <Main 
              currentModel={currentModel} 
              setCurrentModel={setCurrentModel}
            />
          } />
          <Route path="/chat/:id" element={
            <Main 
              currentModel={currentModel} 
              setCurrentModel={setCurrentModel}
            />
          } />
        </Route>

        <Route element={<ProtectedRoute offline={offline} />}>
          <Route path="/login" element={<Login />} />
          <Route path="/login/auth" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/pending/:id" element={<Signup />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/forgot/set/:userId/:secret" element={<Forgot />} />
        </Route>
        <Route
          path="*"
          element={
            <Error status={404} content={"This page could not be found."} />
          }
        />
      </Routes>
    </section>
  );
};

export default App;
