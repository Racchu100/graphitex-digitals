import { useUser } from "./useUser";

export function useRoles() {
  const { roles, loading, error } = useUser();

  const safeRoles = Array.isArray(roles) ? roles : [];
  const isInfluencer = safeRoles.some(r => r?.role === "influencer");
  const isProvider = safeRoles.some(r => r?.role === "provider");
  const isAdmin = safeRoles.some(r => r?.role === "admin");
  const isCustomer = !isInfluencer && !isProvider && !isAdmin && !loading;

  return {
    roles: safeRoles,
    isInfluencer,
    isProvider,
    isAdmin,
    isCustomer,
    loading,
    error
  };
}
