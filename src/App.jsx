import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Tests from './pages/Tests';
import TestOrders from './pages/TestOrders';
import ResultEntry from './pages/ResultEntry';
import Permissions from './pages/Permissions';
import DueList from './pages/DueList';
import AdmitPatients from './pages/AdmitPatients';
import OperationCategories from './pages/OperationCategories';
import Urine from './pages/Urine';
import UrineForm from './pages/UrineForm';
import Cbc from './pages/Cbc';
import CbcForm from './pages/CbcForm';

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/test-orders" element={<TestOrders />} />
        <Route path="/result-entry" element={<ResultEntry />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/due" element={<DueList />} />
        <Route path="/operation-categories" element={<OperationCategories />} />
        <Route path="/admit-patients" element={<AdmitPatients />} />

        <Route path="/urine" element={<Urine />} />
        <Route path="/urine/new" element={<UrineForm />} />
        <Route path="/urine/edit/:id" element={<UrineForm />} />
        <Route path="/cbc" element={<Cbc />} />
        <Route path="/cbc/new" element={<CbcForm />} />
        <Route path="/cbc/edit/:id" element={<CbcForm />} />
        <Route path="/users" element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}><Users /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}