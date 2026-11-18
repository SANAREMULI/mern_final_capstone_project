import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import FlightDetail from './pages/FlightDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SavedFlightsPage from './pages/SavedFlightsPage';
import MyTripsPage from './pages/MyTripsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import BoardingPassPage from './pages/BoardingPassPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTickets from './pages/admin/AdminTickets';
import AdminFlights from './pages/admin/AdminFlights';
import AdminWaitlist from './pages/admin/AdminWaitlist';
import AdminAirports from './pages/admin/AdminAirports';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flights/:id" element={<FlightDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/saved" element={<SavedFlightsPage />} />
            <Route path="/trips" element={<MyTripsPage />} />
            <Route path="/tickets/:id/seat" element={<SeatSelectionPage />} />
            <Route path="/tickets/:id/boarding-pass" element={<BoardingPassPage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="flights" element={<AdminFlights />} />
              <Route path="waitlist" element={<AdminWaitlist />} />
              <Route path="airports" element={<AdminAirports />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
