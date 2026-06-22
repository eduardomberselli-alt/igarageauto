import { Navigate } from "react-router-dom";

// Aba EAD foi consolidada em /conhecimento (aba "Aulas").
export default function EAD() {
  return <Navigate to="/conhecimento?tab=aulas" replace />;
}
