import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import WelcomeDialog from "./components/WelcomeDialog";
import { SettingsContext, UserContext } from "./context";
import useStorage from "./hooks/useStorage";
import AboutPage from "./pages/AboutPage";
import ConductPage from "./pages/ConductPage";
import GamePage from "./pages/GamePage";
import HelpPage from "./pages/HelpPage";
import LegalPage from "./pages/LegalPage";
import LobbyPage from "./pages/LobbyPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage"
import "./styles.css";
import { darkTheme, lightTheme } from "./themes";
import { generateColor, generateName } from "./util";

function getOrCreateUserId() {
  let id = localStorage.getItem("userId");
  if (!id) {
    id =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2);
    localStorage.setItem("userId", id);
  }
  return id;
}

function App() {
  const [userId] = useState(getOrCreateUserId);
  const [userName, setUserName] = useStorage("userName", generateName());
  const [userColor, setUserColor] = useStorage("userColor", generateColor());

  const [themeType, setThemeType] = useStorage("theme", "light");
  const [customLightTheme, setCustomLightTheme] = useState(lightTheme);
  const [customDarkTheme, setCustomDarkTheme] = useState(darkTheme);
  const [customColors, setCustomColors] = useStorage("customColors", "{}");
  const [keyboardLayout, setKeyboardLayout] = useStorage(
    "keyboardLayout",
    "QWERTY",
  );
  const [layoutOrientation, setLayoutOrientation] = useStorage(
    "layout",
    "portrait",
  );
  const [cardOrientation, setCardOrientation] = useStorage(
    "orientation",
    "vertical",
  );

  const toggleLayoutOrientation = () => {
    setLayoutOrientation((x) => (x === "portrait" ? "landscape" : "portrait"));
  };
  const toggleCardOrientation = () => {
    setCardOrientation((x) => (x === "vertical" ? "horizontal" : "vertical"));
  };

  const [volume, setVolume] = useStorage("volume", "on");

  useEffect(() => {
    const parsedCustoms = JSON.parse(customColors);
    if (parsedCustoms.light) {
      setCustomLightTheme({
        ...lightTheme,
        custom: {
          ...lightTheme.custom,
          setCard: { ...lightTheme.custom.setCard, ...parsedCustoms.light },
        },
      });
    }
    if (parsedCustoms.dark) {
      setCustomDarkTheme({
        ...darkTheme,
        custom: {
          ...darkTheme.custom,
          setCard: { ...darkTheme.custom.setCard, ...parsedCustoms.dark },
        },
      });
    }
  }, [customColors]);

  const handleChangeTheme = () => {
    setThemeType(themeType === "light" ? "dark" : "light");
  };

  const handleCustomColors = (custom) => {
    setCustomColors(JSON.stringify(custom));
  };

  const user = {
    id: userId,
    name: userName,
    color: userColor,
    setName: setUserName,
    setColor: setUserColor,
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        theme={themeType === "light" ? customLightTheme : customDarkTheme}
      >
        <BrowserRouter>
          <CssBaseline />
          <UserContext.Provider value={user}>
            <SettingsContext.Provider
              value={{
                keyboardLayout,
                setKeyboardLayout,
                volume,
                setVolume,
                layoutOrientation,
                toggleLayoutOrientation,
                cardOrientation,
                toggleCardOrientation,
              }}
            >
              <WelcomeDialog />
              <Navbar
                themeType={themeType}
                handleChangeTheme={handleChangeTheme}
                customColors={JSON.parse(customColors)}
                handleCustomColors={handleCustomColors}
              />
              <Routes>
                <Route path="/help" element={<HelpPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/conduct" element={<ConductPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/" element={<LobbyPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </SettingsContext.Provider>
          </UserContext.Provider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
