import { Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "./i18n";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Messages from "./pages/Messages";

export default function App() {
  return (
    <I18nProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="messages" element={<Messages />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </I18nProvider>
  );
}
