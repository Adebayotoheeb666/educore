import axios from "axios";
import { toast } from "sonner";
import { BACKEND_URL } from "../config/apiConfig";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../utils/authSession";

// Helper function to safely extract error message
const getErrorMessage = (error) => {
  // Check if error response exists and has data
  if (error.response && error.response.data) {
    // Return the message if it exists, otherwise stringify the data
    return error.response.data.message || JSON.stringify(error.response.data);
  }
  // Fall back to error message or string representation
  return error.message || error.toString() || "An unexpected error occurred";
};

export const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
};

// Register Business
export const registerBusiness = async (userData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/register`,
      userData,
      { withCredentials: true },
    );
    if (response.statusText === "OK") {
      toast.success("User Registered successfully");
    }
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

// Register School
export const registerSchool = async (userData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/register-school`,
      userData,
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

// Login User
export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, userData, { withCredentials: true });
    if (response?.data?.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

// Get current user profile
export const getMe = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/me`);
    return response.data;
  } catch (error) {
    return null;
  }
};

// Logout User
export const logoutUser = async () => {
  try {
    await axios.get(`${BACKEND_URL}/api/auth/logout`);
  } catch (error) {
    // ignore logout errors
  } finally {
    clearAccessToken();
  }
};

// Forgot Password
export const forgotPassword = async (userData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/forgotpassword`,
      userData,
    );
    toast.success(response.data.message);
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

// Reset Password
export const resetPassword = async (
  userData,
  resetToken,
  email,
  businessEmail,
) => {
  try {
    // Build query params - email is required, businessEmail is optional (backward compat)
    let queryString = `email=${encodeURIComponent(email)}`;
    if (businessEmail) {
      queryString += `&businessEmail=${encodeURIComponent(businessEmail)}`;
    }
    const response = await axios.put(
      `${BACKEND_URL}/api/auth/resetpassword/${resetToken}?${queryString}`,
      userData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

// Get Login Status
export const getLoginStatus = async () => {
  return Boolean(getAccessToken());
};

// Get User Profile
export const getBusiness = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/business/getbusiness`);
    return response.data;
  } catch (error) {
    // If unauthorized (401) or session expired, don't show error toast
    if (error.response && error.response.status === 401) {
      console.log("Session expired, please login again");
      return null;
    }

    const message = getErrorMessage(error);
    toast.error(message);
    return null;
  }
};
// Update Profile
export const updateBusiness = async (formData) => {
  try {
    const response = await axios.patch(
      `${BACKEND_URL}/api/business/updatebusiness`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};
// Update Profile
export const changePassword = async (formData) => {
  try {
    const response = await axios.patch(
      `${BACKEND_URL}/api/business/changepassword`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const addSales = async (formData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/add-sales`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const deleteSales = async (email) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/delete-sales`,
      email,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const updateSales = async (formData) => {
  try {
    const response = await axios.patch(
      `${BACKEND_URL}/api/business/update-sales-rep`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const updateSubscription = async (formData) => {
  try {
    const response = await axios.patch(
      `${BACKEND_URL}/api/business/subscribe`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const getAllBusinesses = async () => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/business/get-all-business`,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const verifyBusinessEmail = async (email) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/verify-send-grid`,
      email,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const sendReceiptEmail = async (formData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/send-receipt-email`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const shareReceipt = async (sale, id) => {
  try {
    // const response = await axios.get(`${API_URL}download-receipt/${id}`, { responseType: "blob" });
    const response = await axios.get(
      `${BACKEND_URL}/api/business/share-receipt?id=${sale._id}`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const activateActivityStatus = async () => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/activate-activity-status`,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const updateSubscriptionPlan = async (id, formData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/update-subscription-plan/${id}`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const sendAdminBusinessMessage = async (payload) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/admin/send-business-message`,
      payload,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    throw error;
  }
};

// ==================== Store Management ====================

export const getConnectedStores = async () => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/business/stores`,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    return null;
  }
};

export const connectStore = async (formData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/stores/connect`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    throw error;
  }
};

export const registerAndConnectStore = async (formData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/stores/register`,
      formData,
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    throw error;
  }
};

export const switchBusinessStore = async (businessId) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/stores/switch`,
      { businessId },
    );
    if (response?.data?.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    throw error;
  }
};

export const disconnectStore = async (businessId) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/business/stores/disconnect`,
      { businessId },
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    throw error;
  }
};
// ==================== Invitation Management ====================

export const getInviteDetails = async (token) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/invite/${token}`);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

export const acceptInvite = async (token, userData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/accept-invite/${token}`,
      userData,
    );
    if (response?.data?.token) {
      setAccessToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};
// ==================== School Management ====================

export const getSchoolProfile = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/school`);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    return null;
  }
};

export const updateSchoolProfile = async (formData) => {
  try {
    const response = await axios.patch(`${BACKEND_URL}/api/school`, formData);
    toast.success("School profile updated successfully");
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};

export const updateSchoolSettings = async (formData) => {
  try {
    const response = await axios.patch(`${BACKEND_URL}/api/school/settings`, formData);
    toast.success("Academic settings updated successfully");
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
  }
};
