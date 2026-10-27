import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminMessages from "./pages/admin/AdminMessages";
import NoteForm from "./pages/admin/NoteForm";

export default function App() {
  return (
    <Routes>
      {/* 前台 */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      {/* 后台 */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="notes" replace />} />
        <Route path="notes" element={<AdminNotes />} />
        <Route path="notes/new" element={<NoteForm />} />
        <Route path="notes/:id/edit" element={<NoteForm />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      {/* 兜底 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
