const axios = require("axios");

class SalesjetConnector {
  async sendDataToSalesJet({ event_name, requestBody, api_key }) {
    const response = await axios({
      url: "https://sj-api.com/externalapp/track",
      headers: {
        Authorization: api_key,
      },
      method: "POST",
      data: {
        event_name: event_name,
        contact: requestBody,
      },
    });

    if (response.status !== 200) {
      console.error(err.message);
      return new Error(
        "An unexpected error has occurred 😭, please tell Mattia immediately!"
      );
    }

    return { ...response, requestBody };
  }
}

module.exports = SalesjetConnector;
