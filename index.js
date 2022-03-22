const dotenv = require("dotenv");
const path = require("path");
const { promises: fs } = require("fs");

const { parse } = require("csv-parse/sync");
const { RateLimiter } = require("limiter");

const SalesjetConnector = require("./utils/_salesjet-connector.js");

dotenv.config();

class CSVToSalesJet {
  constructor({ pathToCsv }) {
    this.pathToCsv = pathToCsv;
  }

  async parseData() {
    const content = await fs.readFile(this.pathToCsv);
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });
    return records.map((record) => record);
  }

  async connectEmailsToSalesJet(leadsData, limiter) {
    try {
      for (let lead of leadsData) {
        try {
          const salesjetConnector = new SalesjetConnector();
          await limiter.removeTokens(1);
          const response = await salesjetConnector.sendDataToSalesJet({
            event_name: process.env.EVENT_NAME,
            requestBody: lead,
            api_key: process.env.SALESJET_API_KEY,
          });
          console.log(response);
        } catch (err) {
          console.log(err);
        }
      }
      console.log("Loop terminated");
      return "Operation successful";
    } catch (err) {
      console.error(err);
    }
  }
}

const csvToSalesJet = new CSVToSalesJet({
  pathToCsv: `${__dirname}/sample.csv`,
});

(async () => {
  const csvParsedData = await csvToSalesJet.parseData();

  const salesJetLeadsData = csvParsedData.map((lead) => ({
    first_name: lead["Nome"],
    last_name: lead["Cognome"],
    email: lead["Email"],
    phone_number: lead["Numero di Telefono"],
    custom_attributes: {
      "da183cfd-dea9-ec11-a9ab-ff1d79b08822": lead["Data"],
      "d9183cfd-dea9-ec11-a9ab-ff1d79b08822": lead["Note"],
      "99cee403-dfa9-ec11-a9ab-ff1d79b08822": lead["Ora"],
    },
  }));

  const limiter = new RateLimiter({
    tokensPerInterval: 1,
    interval: "second",
  });

  const result = await csvToSalesJet.connectEmailsToSalesJet(
    salesJetLeadsData,
    limiter
  );
  console.log(result);
})();
