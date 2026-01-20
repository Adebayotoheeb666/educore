import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
    const context = useAuthContext();

    return {
        ...context,
        // Legacy support if anything uses customClaims object directly
        customClaims: { role: context.role, schoolId: context.schoolId }
    };
};
