import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchSchool } from '../redux/features/school/schoolSlice';

const useSchoolSettings = () => {
  const dispatch = useDispatch();
  const { school, loading } = useSelector((state) => state.school);

  useEffect(() => {
    if (!school) dispatch(fetchSchool());
  }, [dispatch, school]);

  return {
    school,
    loading,
    schoolName: school?.name || '',
    settings: school?.settings || {},
    subscription: school?.subscription || {},
    isSubscriptionActive: school?.subscription?.status === 'active',
    aiEnabled: (school?.subscription?.usedAiTokens || 0) < (school?.subscription?.aiTokenBudget || 100000),
    currentTerm: school?.settings?.currentTerm || '',
    currentSession: school?.settings?.currentSession || '',
    gradingScale: school?.settings?.gradingScale || 'nigerian_senior_secondary',
  };
};

export default useSchoolSettings;
