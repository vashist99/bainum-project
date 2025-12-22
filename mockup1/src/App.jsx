import { Routes, Route } from 'react-router';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeachersPage from './pages/TeachersPage';
import AddTeacherForm from './pages/AddTeacherForm';
import AddChildForm from './pages/AddChildForm';
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
      <Route path="/children/add" element={<AddChildForm />} />
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