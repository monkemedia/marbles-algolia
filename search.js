const algoliasearch = require("algoliasearch");
const fetch = require('node-fetch')
const dotenv = require("dotenv");

dotenv.config();

(async () => {
  try {
    // Algolia client credentials
    const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
    const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY;
    const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

    // Initialize the client
    // https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

    // Initialize an index
    // https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
    const index = client.initIndex(ALGOLIA_INDEX_NAME);



    res = await index.search("baby", {
      attributesToRetrieve: ['name'],
    });
    console.log("search results: ", res.hits);
  } catch (err) {
    console.log(err)
  }
})();
