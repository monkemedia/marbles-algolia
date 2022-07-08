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
    const BIG_BASE_URL = process.env.BIG_BASE_URL
    const BIG_VERSION = process.env.BIG_VERSION
    const BIG_CLIENT_ID = process.env.BIG_CLIENT_ID
    const BIG_CLIENT_SECRET = process.env.BIG_CLIENT_SECRET
    const BIG_ACCESS_TOKEN = process.env.BIG_ACCESS_TOKEN
    const BIG_STORE_HASH = process.env.BIG_STORE_HASH

    // Initialize the client
    // https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

    // Initialize an index
    // https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
    const index = client.initIndex(ALGOLIA_INDEX_NAME);

    const products = []
    
    const getProducts = async (page = 1) => {
      const response = await fetch(`${BIG_BASE_URL}/${BIG_STORE_HASH}/${BIG_VERSION}/catalog/products/?page=${page}&is_visible=true`, { 
        method: 'GET', 
        headers: {
          Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': BIG_ACCESS_TOKEN
        }
      })

      const data = await response.json()

      if(data.meta.pagination.current_page <= data.meta.pagination.total_pages) {
        data.data.forEach(item => {
          products.push({
            objectID: item.id,
            name: item.name,
            sku: item.sku,
            description: item.description,
            keywords: item.search_keywords
          })
        })

        await getProducts(data.meta.pagination.current_page + 1)
      }
    }

    await getProducts()

    await index.saveObjects(products).wait();

    res = await index.search("");
    console.log("Current objects: ", res.hits);
  } catch (err) {
    console.log(err)
  }
})();
