/**
 * Platform subscription plans (NGN). Super admin can override per-school via admin console.
 */
const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential tools for small schools',
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    aiTokenBudget: 100000,
    maxStudents: 300,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Full academics & finance for growing schools',
    monthlyPrice: 35000,
    yearlyPrice: 350000,
    aiTokenBudget: 500000,
    maxStudents: 1000,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Unlimited scale with priority support',
    monthlyPrice: 75000,
    yearlyPrice: 750000,
    aiTokenBudget: 2000000,
    maxStudents: 5000,
  },
};

const getPlan = (planId) => SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.basic;

const getPlanPrice = (planId, billingCycle = 'yearly') => {
  const plan = getPlan(planId);
  return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
};

module.exports = {
  SUBSCRIPTION_PLANS,
  getPlan,
  getPlanPrice,
};
