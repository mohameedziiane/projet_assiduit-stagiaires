import { Outlet } from "react-router-dom";
import MustChangePasswordBanner from "../components/auth/MustChangePasswordBanner";
import DirecteurSidebar from "../components/layout/DirecteurSidebar";
import DirecteurTopbar from "../components/layout/DirecteurTopbar";
import "./StudentLayout.css";

export default function DirecteurLayout() {
  return (
    <div className="student-shell">
      <DirecteurSidebar />

      <div className="student-main">
        <DirecteurTopbar />
        <MustChangePasswordBanner />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
