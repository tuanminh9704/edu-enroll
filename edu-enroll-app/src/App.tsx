import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { message } from 'antd';
import { PublicLayout } from './layouts/PublicLayout';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { PrivateRoute } from './routes/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import OTPVerification from './pages/Auth/OTPVerification';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EnrollmentPage from './pages/Enrollment';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminEnrollments from './pages/Admin/Enrollments';
import AdminUsers from './pages/Admin/Users';
import AdminExamSchedules from './pages/Admin/ExamSchedules';
import AdminExamScores from './pages/Admin/ExamScores';
import AdminPrograms from './pages/Admin/Programs';
import AdminClasses from './pages/Admin/Classes';
import AdminBroadcast from './pages/Admin/Broadcast';
import AdminRechecks from './pages/Admin/Rechecks';
import AdminInterviews from './pages/Admin/Interviews';
import AdminInvoices from './pages/Admin/Invoices';
import AdminContent from './pages/Admin/Content';
import ProfilePage from './pages/Profile';
import NotificationsPage from './pages/Notifications';
import { useEnrollmentStore } from './store/enrollment.store';
import { enrollmentService } from './services/enrollment.service';

function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const { setEnrollment } = useEnrollmentStore();

  useEffect(() => {
    const status = searchParams.get('payment');
    if (status === 'success') {
      message.success('Thanh toán thành công!');
      enrollmentService.getEnrollment().then(setEnrollment).catch(() => {});
    } else if (status === 'failed') {
      message.error('Thanh toán thất bại. Vui lòng thử lại.');
    }
  }, [searchParams, setEnrollment]);

  return <Navigate to="/ho-so" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/dang-ky" element={<Register />} />
        <Route path="/xac-thuc-otp" element={<OTPVerification />} />
        <Route path="/quen-mat-khau" element={<ForgotPassword />} />
        <Route path="/tuyen-sinh" element={<PaymentReturn />} />
      </Route>

      {/* Student routes */}
      <Route element={<PrivateRoute allowedRoles={['student', 'staff', 'admin', 'super_admin']} />}>
        <Route element={<UserLayout />}>
          <Route path="/tai-khoan" element={<Dashboard />} />
          <Route path="/ho-so" element={<EnrollmentPage />} />
          <Route path="/ho-so-ca-nhan" element={<ProfilePage />} />
          <Route path="/thong-bao" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<PrivateRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/quan-tri" element={<AdminDashboard />} />
          <Route path="/quan-tri/ho-so" element={<AdminEnrollments />} />
          <Route path="/quan-tri/nguoi-dung" element={<AdminUsers />} />
          <Route path="/quan-tri/ky-thi" element={<AdminExamSchedules />} />
          <Route path="/quan-tri/diem-thi" element={<AdminExamScores mode="entry" />} />
          <Route path="/quan-tri/xem-diem-thi" element={<AdminExamScores mode="view" />} />
          <Route path="/quan-tri/phuc-khao" element={<AdminRechecks />} />
          <Route path="/quan-tri/phong-van" element={<AdminInterviews />} />
          <Route path="/quan-tri/hoa-don" element={<AdminInvoices />} />
          <Route path="/quan-tri/chuong-trinh" element={<AdminPrograms />} />
          <Route path="/quan-tri/lop-hoc" element={<AdminClasses />} />
          <Route path="/quan-tri/thong-bao" element={<AdminBroadcast />} />
          <Route path="/quan-tri/noi-dung" element={<AdminContent />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
