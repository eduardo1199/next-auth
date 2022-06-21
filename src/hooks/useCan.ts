import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { validateUserPermissions } from "../utils/validateUserPermission";

type UseCanParams = {
  permissions?: string[];
  roles?: string[];
}

export function useCan({ permissions, roles }: UseCanParams) {
  const { user, isAuthenticated } = useContext(AuthContext);

  if(!isAuthenticated) return false;

  const dataIsValidate = { user, permissions, roles };

  const userHasValidPermissions = validateUserPermissions(dataIsValidate);

  return userHasValidPermissions;
}