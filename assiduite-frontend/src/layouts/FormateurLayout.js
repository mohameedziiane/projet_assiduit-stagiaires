import { Outlet } from "react-router-dom";
import MustChangePasswordBanner from "../components/auth/MustChangePasswordBanner";
import FormateurSidebar from "../components/layout/FormateurSidebar";
import FormateurTopbar from "../components/layout/FormateurTopbar";
import "./StudentLayout.css";

export default function FormateurLayout() {
  return (
    <div className="student-shell">
      <FormateurSidebar />

      <div className="student-main">
        <FormateurTopbar />
        <MustChangePasswordBanner />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
