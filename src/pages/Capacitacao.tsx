import { Navigate } from "react-router-dom";

// Capacitação foi movida para a página de Perfil.
export default function Capacitacao() {
  return <Navigate to="/perfil" replace />;
}
