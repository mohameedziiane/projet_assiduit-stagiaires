import { Outlet } from "react-router-dom";
import MustChangePasswordBanner from "../components/auth/MustChangePasswordBanner";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminTopbar from "../components/layout/AdminTopbar";
import "./StudentLayout.css";

export default function AdminLayout() {
  return (
    <div className="student-shell">
      <AdminSidebar />

      <div className="student-main">
        <AdminTopbar />
        <MustChangePasswordBanner />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
