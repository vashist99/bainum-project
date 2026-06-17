import { Routes, Route, Navigate, useParams } from 'react-router';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeachersPage from './pages/TeachersPage';
import AddTeacherForm from './pages/AddTeacherForm';
import EditTeacherForm from './pages/EditTeacherForm';
import SchoolsPage from './pages/SchoolsPage';
import AddSchoolForm from './pages/AddSchoolForm';
import EditSchoolForm from './pages/EditSchoolForm';
import AddChildForm from './pages/AddChildForm';
import EditChildForm from './pages/EditChildForm';
import DataPage from './pages/DataPage';
import AddDataForm from './pages/AddDataForm';
import ChildDataPage from './pages/ChildDataPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import TeacherDataDetailPage from './pages/TeacherDataDetailPage';
import ParentRegisterPage from './pages/ParentRegisterPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ClassroomsPage from './pages/ClassroomsPage';
import CreateClassroomForm from './pages/CreateClassroomForm';
import ClassroomHomePage from './pages/ClassroomHomePage';
import ParentHomeRecordingPage from './pages/ParentHomeRecordingPage';
import ProtectedRoute from './components/ProtectedRoute';

function LegacySchoolEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/schools/edit/${id}`} replace />;
}

const App = () => {
  return <div data-theme="forest" className="min-h-screen">
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/parent/register" element={<ParentRegisterPage />} />
      <Route path="/teacher/register" element={<TeacherRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/home" element={
        <ProtectedRoute skipParentHomeRedirect>
          <HomePage />
        </ProtectedRoute>
      } />
      <Route path="/home/recording" element={
        <ProtectedRoute requiredRole="parent">
          <ParentHomeRecordingPage />
        </ProtectedRoute>
      } />
      <Route path="/my-classrooms" element={<Navigate to="/home" replace />} />
      <Route path="/classrooms" element={
        <ProtectedRoute requiredRole="admin">
          <ClassroomsPage />
        </ProtectedRoute>
      } />
      <Route path="/classrooms/create" element={
        <ProtectedRoute excludeRoles={['parent']}>
          <CreateClassroomForm />
        </ProtectedRoute>
      } />
      <Route path="/classrooms/:id" element={
        <ProtectedRoute skipParentHomeRedirect>
          <ClassroomHomePage />
        </ProtectedRoute>
      } />
      <Route path="/schools" element={
        <ProtectedRoute requiredRole="admin">
          <SchoolsPage />
        </ProtectedRoute>
      } />
      <Route path="/schools/add" element={
        <ProtectedRoute requiredRole="admin">
          <AddSchoolForm />
        </ProtectedRoute>
      } />
      <Route path="/schools/edit/:id" element={
        <ProtectedRoute requiredRole="admin">
          <EditSchoolForm />
        </ProtectedRoute>
      } />
      <Route path="/centers" element={<Navigate to="/schools" replace />} />
      <Route path="/centers/add" element={<Navigate to="/schools/add" replace />} />
      <Route path="/centers/edit/:id" element={<LegacySchoolEditRedirect />} />
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
      <Route path="/profile" element={
        <ProtectedRoute requiredRole="teacher">
          <TeacherProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/teachers/:username" element={
        <ProtectedRoute skipParentHomeRedirect>
          <TeacherDataDetailPage />
        </ProtectedRoute>
      } />
    </Routes>
  </div>;
};

export default App;
