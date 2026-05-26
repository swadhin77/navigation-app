import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* ===== Screens ===== */
import Login from "./Frontend/Login/login.jsx";
import Register from "./Frontend/NewUser/Register.jsx";
import ForgotPassword from "./Frontend/ForgotPassword/ForgotPassword.jsx";
import Dashboard from "./Frontend/Dashboard/Dashboard.jsx";
import Setting from "./Frontend/Setting/Setting.jsx";
import ContactUs from "./Frontend/ContactUs/ContactUs.jsx";
import Help from "./Frontend/Help/Help.jsx";
import ReferFriend from "./Frontend/ReferaFriend/ReferFriend.jsx";
import RoutePage from "./Frontend/Route/Route.jsx";
import StartNavigation from "./Frontend/StartNavigation/StartNavigation.jsx";
import { TrafficProvider } from "./Frontend/context/TrafficContext.jsx"
/* ===== Providers ===== */
import { ThemeProvider } from "./Frontend/Other/Theam";
import { NavigationProvider } from "./Frontend/Navigation/NavigationContext.jsx";
import { VoiceProvider } from "./Frontend/context/VoiceContext.jsx";

/* ===== Offline Provider ===== */
import { OfflineProvider } from "./Frontend/offline-feature/OfflineProvider";

/* ===== Mapbox CSS ===== */
import "mapbox-gl/dist/mapbox-gl.css";

/* ===== Global Styles ===== */
import "./Frontend/styles/map.css";
import "./Frontend/styles/ui.css";
// 🔐 Protected Route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("userToken");
  return token ? children : <Navigate to="/login" replace />;
};
function App() {
  return (
    <ThemeProvider>
      <OfflineProvider>
        <NavigationProvider>
            <VoiceProvider>
              <FriendProvider>
			  	<TrafficProvider>
                <Router>
                  <Routes>

                    {/* Redirect root */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    {/* Authentication */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Info Pages */}
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/referfriend" element={<ReferFriend />} />

                    {/* Navigation System */}
					<Route
					  path="/dashboard"
					  element={
					    <ProtectedRoute>
					      <Dashboard />
					    </ProtectedRoute>
					  }
					/>
					<Route
					  path="/search-point"
					  element={
					    <ProtectedRoute>
					      <SearchPoint />
					    </ProtectedRoute>
					  }
					/>

					<Route
					  path="/route"
					  element={
					    <ProtectedRoute>
					      <RoutePage />
					    </ProtectedRoute>
					  }
					/>

					<Route
					  path="/start-navigation"
					  element={
					    <ProtectedRoute>
					      <StartNavigation />
					    </ProtectedRoute>
					  }
					/>

					<Route
					  path="/settings"
					  element={
					    <ProtectedRoute>
					      <Setting />
					    </ProtectedRoute>
					  }
					/>

                    {/* Weather Page */}
                    <Route path="/weather" element={<Weather open={true} />} />

                    {/* Unknown Routes */}
                    <Route path="*" element={<Navigate to="/login" replace />} />

                  </Routes>
                </Router>
				</TrafficProvider>
              </FriendProvider>
            </VoiceProvider>
        </NavigationProvider>
      </OfflineProvider>
    </ThemeProvider>
  );
}

export default App;