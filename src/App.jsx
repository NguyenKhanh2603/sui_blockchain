import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import PublicProfile from "./pages/PublicProfile";
import RecruiterLayout from "./layouts/RecruiterLayout";
import CandidateLayout from "./layouts/CandidateLayout";
import IssuerLayout from "./layouts/IssuerLayout";
import Vault from "./pages/candidate/Vault";
import CVBuilder from "./pages/candidate/CVBuilder";
import CandidateRequests from "./pages/candidate/Requests";
import CandidateSettings from "./pages/candidate/Settings";
import Dashboard from "./pages/recruiter/Dashboard";
import CandidateProfile from "./pages/recruiter/CandidateProfile";
import Saved from "./pages/recruiter/Saved";
import Notes from "./pages/recruiter/Notes";
import RecruiterSettings from "./pages/recruiter/Settings";
import RecruiterJobs from "./pages/recruiter/Jobs";
import IssuerStatus from "./pages/issuer/Status";
import IssuerOverview from "./pages/issuer/Overview";
import IssuerRequests from "./pages/issuer/Requests";
import IssueCertificate from "./pages/issuer/Issue";
import IssuedList from "./pages/issuer/Issued";
import IssuedDetail from "./pages/issuer/IssuedDetail";
import RevokeCenter from "./pages/issuer/Revoke";
import Verification from "./pages/issuer/Verification";
import TrustPage from "./pages/issuer/TrustPage";
import Compliance from "./pages/issuer/Compliance";
import Audit from "./pages/issuer/Audit";
import IssuerSettings from "./pages/issuer/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Verifications from "./pages/admin/Verifications";
import VerificationDetail from "./pages/admin/VerificationDetail";
import AdminAudit from "./pages/admin/Audit";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/u/:candidateId" element={<PublicProfile />} />

      <Route
        path="/candidate/*"
        element={
          <ProtectedRoute allowedRoles={["candidate"]}>
            <CandidateLayout />
          </ProtectedRoute>
        }
      >
        <Route path="vault" element={<Vault />} />
        <Route path="cv-builder" element={<CVBuilder />} />
        <Route path="requests" element={<CandidateRequests />} />
        <Route path="settings" element={<CandidateSettings />} />
        <Route path="*" element={<Navigate to="vault" replace />} />
      </Route>

      <Route
        path="/recruiter/*"
        element={
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="candidate/:candidateId" element={<CandidateProfile />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="saved" element={<Saved />} />
        <Route path="notes" element={<Notes />} />
        <Route path="settings" element={<RecruiterSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/issuer/*"
        element={
          <ProtectedRoute allowedRoles={["issuer"]}>
            <IssuerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="status" element={<IssuerStatus />} />
        <Route path="verification" element={<Verification />} />
        <Route path="overview" element={<IssuerOverview />} />
        <Route path="requests" element={<IssuerRequests />} />
        <Route path="issue" element={<IssueCertificate />} />
        <Route path="issued" element={<IssuedList />} />
        <Route path="issued/:recordId" element={<IssuedDetail />} />
        <Route path="revoke" element={<RevokeCenter />} />
        <Route path="trust-page" element={<TrustPage />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="audit" element={<Audit />} />
        <Route path="settings" element={<IssuerSettings />} />
        <Route path="*" element={<Navigate to="status" replace />} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="reviews" element={<Verifications />} />
        <Route path="verifications" element={<Verifications />} />
        <Route path="verifications/:submissionId" element={<VerificationDetail />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
