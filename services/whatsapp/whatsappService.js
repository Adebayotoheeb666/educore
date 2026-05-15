const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;
  }

  async sendTextMessage(to, message) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message }
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      console.error("WhatsApp Error:", error?.response?.data || error.message);
      return null;
    }
  }

  async sendDocumentMessage(to, documentUrl, caption) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "document",
        document: {
          link: documentUrl,
          caption: caption
        }
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      console.error("WhatsApp Document Error:", error?.response?.data || error.message);
      return null;
    }
  }

  async sendTemplateMessage(to, templateName, components = []) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: components
        }
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      console.error("WhatsApp Template Error:", error?.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new WhatsAppService();
