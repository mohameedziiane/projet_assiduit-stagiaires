import { Outlet } from "react-router-dom";
import MustChangePasswordBanner from "../components/auth/MustChangePasswordBanner";
import StudentSidebar from "../components/layout/StudentSidebar";
import StudentTopbar from "../components/layout/StudentTopbar";
import "./StudentLayout.css";

export default function StudentLayout() {
  return (
    <div className="student-shell">
      <StudentSidebar />

      <div className="student-main">
        <StudentTopbar />
        <MustChangePasswordBanner />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
