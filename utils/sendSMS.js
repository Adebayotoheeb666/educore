const axios = require('axios');

const sendSMS = async (phoneNumber, message) => {
    try {
        const payload = {
            to: phoneNumber,
            from: process.env.TERMII_SENDER_ID || "EduCore",
            sms: message,
            type: "plain",
            channel: "generic",
            api_key: process.env.TERMII_API_KEY,
        };

        const response = await axios.post("https://api.ng.termii.com/api/sms/send", payload);
        return response.data;
    } catch (error) {
        console.error("SMS Sending Error:", error?.response?.data || error.message);
        return null;
    }
};

const sendBulkSMS = async (phoneNumbers, message) => {
    try {
        const payload = {
            to: phoneNumbers,
            from: process.env.TERMII_SENDER_ID || "EduCore",
            sms: message,
            type: "plain",
            channel: "generic",
            api_key: process.env.TERMII_API_KEY,
        };

        const response = await axios.post("https://api.ng.termii.com/api/sms/send/bulk", payload);
        return response.data;
    } catch (error) {
        console.error("Bulk SMS Error:", error?.response?.data || error.message);
        return null;
    }
};

const formatNigerianPhone = (phone) => {
    if (!phone) return null;
    let formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) {
        formatted = '234' + formatted.substring(1);
    }
    return formatted;
};

module.exports = { sendSMS, sendBulkSMS, formatNigerianPhone };
