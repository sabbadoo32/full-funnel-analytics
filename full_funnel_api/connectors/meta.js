const axios = require('axios');

class MetaConnector {
  constructor(config) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v17.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async getCampaigns(adAccountId, params = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/act_${adAccountId}/campaigns`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,objective,status,start_time,stop_time,daily_budget,lifetime_budget,insights',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getAds(adAccountId, params = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/act_${adAccountId}/ads`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,campaign_id,status,created_time,updated_time,insights',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getInsights(adAccountId, params = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/act_${adAccountId}/insights`, {
        params: {
          access_token: this.accessToken,
          fields: 'impressions,clicks,ctr,spend,actions,conversions,cost_per_action_type',
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async getCustomAudiences(adAccountId) {
    try {
      const response = await axios.get(`${this.baseUrl}/act_${adAccountId}/customaudiences`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,subtype,approximate_count,data_source,delivery_status,operation_status'
        }
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async createCustomAudience(adAccountId, data) {
    try {
      const response = await axios.post(`${this.baseUrl}/act_${adAccountId}/customaudiences`, {
        access_token: this.accessToken,
        ...data
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      return {
        status,
        code: data.error?.code,
        message: data.error?.message,
        type: data.error?.type,
        subcode: data.error?.error_subcode
      };
    }
    return {
      status: 500,
      message: error.message,
      type: 'UnknownError'
    };
  }
}

module.exports = MetaConnector;
