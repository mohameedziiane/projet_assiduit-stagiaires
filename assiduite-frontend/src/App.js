import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordRequestPage from "./pages/auth/ForgotPasswordRequestPage";

// Stagiaire
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboardPage from "./pages/stagiaire/StudentDashboardPage";
import StudentAbsencesPage from "./pages/stagiaire/StudentAbsencesPage";
import StudentJustificatifPage from "./pages/stagiaire/StudentJustificatifPage";
import StudentBilletsPage from "./pages/stagiaire/StudentBilletsPage";
import StudentStatisticsPage from "./pages/stagiaire/StudentStatisticsPage";
import StudentProfilePage from "./pages/stagiaire/StudentProfilePage";
import ChangePasswordPage from "./pages/shared/ChangePasswordPage";

// Formateur
import FormateurLayout from "./layouts/FormateurLayout";
import FormateurDashboardPage from "./pages/formateur/FormateurDashboardPage";
import FormateurSeancesPage from "./pages/formateur/FormateurSeancesPage";
import FormateurAbsencesPage from "./pages/formateur/FormateurAbsencesPage";
import FormateurBilletsPage from "./pages/formateur/FormateurBilletsPage";
import FormateurStatisticsPage from "./pages/formateur/FormateurStatisticsPage";
import FormateurCommentsPage from "./pages/formateur/FormateurCommentsPage";

// Gestionnaire
import GestionnaireLayout from "./layouts/GestionnaireLayout";
import GestionnaireDashboardPage from "./pages/gestionnaire/GestionnaireDashboardPage";
import GestionnaireStagiairesPage from "./pages/gestionnaire/GestionnaireStagiairesPage";
import GestionnaireGroupesPage from "./pages/gestionnaire/GestionnaireGroupesPage";
import GestionnaireBilletsPage from "./pages/gestionnaire/GestionnaireBilletsPage";
import GestionnaireAbsencesPage from "./pages/gestionnaire/GestionnaireAbsencesPage";
import GestionnaireJustificatifsPage from "./pages/gestionnaire/GestionnaireJustificatifsPage";
import GestionnaireStatisticsPage from "./pages/gestionnaire/GestionnaireStatisticsPage";
import GestionnaireExportPage from "./pages/gestionnaire/GestionnaireExportPage";

// Directeur
import DirecteurLayout from "./layouts/DirecteurLayout";
import DirecteurDashboardPage from "./pages/directeur/DirecteurDashboardPage";
import DirecteurReportsPage from "./pages/directeur/DirecteurReportsPage";
import DirecteurStatisticsPage from "./pages/directeur/DirecteurStatisticsPage";
import AdminLayout from "./layouts/AdminLayout";
import PasswordResetRequestsPage from "./pages/shared/PasswordResetRequestsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordRequestPage />} />

        <Route
          path="/stagiaire"
          element={
            <ProtectedRoute allowedRoles={["stagiaire"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/stagiaire/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="absences" element={<StudentAbsencesPage />} />
          <Route path="justificatif" element={<StudentJustificatifPage />} />
          <Route path="billets" element={<StudentBilletsPage />} />
          <Route path="statistiques" element={<StudentStatisticsPage />} />
          <Route path="profil" element={<StudentProfilePage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="mot-de-passe" element={<StudentProfilePage />} />
        </Route>

        <Route
          path="/formateur"
          element={
            <ProtectedRoute allowedRoles={["formateur"]}>
              <FormateurLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/formateur/dashboard" replace />} />
          <Route path="dashboard" element={<FormateurDashboardPage />} />
          <Route path="seances" element={<FormateurSeancesPage />} />
          <Route path="absences" element={<FormateurAbsencesPage />} />
          <Route path="billets" element={<FormateurBilletsPage />} />
          <Route path="statistiques" element={<FormateurStatisticsPage />} />
          <Route path="commentaires" element={<FormateurCommentsPage />} />
          <Route path="mot-de-passe" element={<ChangePasswordPage />} />
        </Route>

        <Route
          path="/gestionnaire"
          element={
            <ProtectedRoute allowedRoles={["gestionnaire"]}>
              <GestionnaireLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/gestionnaire/dashboard" replace />} />
          <Route path="dashboard" element={<GestionnaireDashboardPage />} />
          <Route path="stagiaires" element={<GestionnaireStagiairesPage />} />
          <Route path="groupes" element={<GestionnaireGroupesPage />} />
          <Route path="absences" element={<GestionnaireAbsencesPage />} />
          <Route path="billets" element={<GestionnaireBilletsPage />} />
          <Route path="justificatifs" element={<GestionnaireJustificatifsPage />} />
          <Route path="statistiques" element={<GestionnaireStatisticsPage />} />
          <Route path="export" element={<GestionnaireExportPage />} />
          <Route path="password-reset-requests" element={<PasswordResetRequestsPage />} />
          <Route path="mot-de-passe" element={<ChangePasswordPage />} />
        </Route>

        <Route
          path="/directeur"
          element={
            <ProtectedRoute allowedRoles={["directeur"]}>
              <DirecteurLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/directeur/dashboard" replace />} />
          <Route path="dashboard" element={<DirecteurDashboardPage />} />
          <Route path="rapports" element={<DirecteurReportsPage />} />
          <Route path="statistiques" element={<DirecteurStatisticsPage />} />
          <Route path="password-reset-requests" element={<PasswordResetRequestsPage />} />
          <Route path="mot-de-passe" element={<ChangePasswordPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/admin/password-reset-requests" replace />}
          />
          <Route
            path="password-reset-requests"
            element={<PasswordResetRequestsPage />}
          />
          <Route path="mot-de-passe" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
