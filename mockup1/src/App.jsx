import { Routes, Route } from 'react-router';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeachersPage from './pages/TeachersPage';
import AddTeacherForm from './pages/AddTeacherForm';
import EditTeacherForm from './pages/EditTeacherForm';
import CentersPage from './pages/CentersPage';
import AddCenterForm from './pages/AddCenterForm';
import EditCenterForm from './pages/EditCenterForm';
import AddChildForm from './pages/AddChildForm';
import EditChildForm from './pages/EditChildForm';
import DataPage from './pages/DataPage';
import AddDataForm from './pages/AddDataForm';
import ChildDataPage from './pages/ChildDataPage';
import ParentRegisterPage from './pages/ParentRegisterPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return <div data-theme="forest" className="min-h-screen">
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/parent/register" element={<ParentRegisterPage />} />
      <Route path="/teacher/register" element={<TeacherRegisterPage />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      <Route path="/centers" element={
        <ProtectedRoute requiredRole="admin">
          <CentersPage />
        </ProtectedRoute>
      } />
      <Route path="/centers/add" element={
        <ProtectedRoute requiredRole="admin">
          <AddCenterForm />
        </ProtectedRoute>
      } />
      <Route path="/centers/edit/:id" element={
        <ProtectedRoute requiredRole="admin">
          <EditCenterForm />
        </ProtectedRoute>
      } />
      <Route path="/teachers" element={
        <ProtectedRoute requiredRole="admin">
          <TeachersPage />
        </ProtectedRoute>
      } />
      <Route path="/teachers/add" element={
        <ProtectedRoute requiredRole="admin">
          <AddTeacherForm />
        </ProtectedRoute>
      } />
      <Route path="/teachers/edit/:id" element={
        <ProtectedRoute requiredRole="admin">
          <EditTeacherForm />
        </ProtectedRoute>
      } />
      <Route path="/children/add" element={<AddChildForm />} />
      <Route path="/children/edit/:id" element={<EditChildForm />} />
      <Route path="/data" element={
        <ProtectedRoute excludeRoles={['parent']}>
          <DataPage />
        </ProtectedRoute>
      } />
      <Route path="/data/add" element={<AddDataForm />} />
      <Route path="/data/child/:childId" element={<ChildDataPage />} />
    </Routes>
  </div>;
};

export default App;