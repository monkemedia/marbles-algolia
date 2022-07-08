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
    const BIG_ACCESS_TOKEN = process.env.BIG_ACCESS_TOKEN
    const BIG_STORE_HASH = process.env.BIG_STORE_HASH

    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
    const index = client.initIndex(ALGOLIA_INDEX_NAME);

    let products = []
    const categoryIds = []


    const addCatIds = (ids) => {
      ids.forEach(id => {
        if(!categoryIds.includes(id)) {
          categoryIds.push(id)
        }
      })
    }

    const getCategories = async (catIds) => {
      const response = await fetch(`${BIG_BASE_URL}/${BIG_STORE_HASH}/${BIG_VERSION}/catalog/categories?id:in=${catIds}&is_visible=true`, { 
        method: 'GET', 
        headers: {
          Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': BIG_ACCESS_TOKEN
        }
      })

      const data = await response.json()

      return data.data.map(({ id, name }) => ({ id, name}))
    }
    
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
            keywords: item.search_keywords,
            categories: item.categories
          })

          addCatIds(item.categories)
        })

        await getProducts(data.meta.pagination.current_page + 1)
      }
    }

    await getProducts()

    const categories = await getCategories(categoryIds)

    products = products.map(prod => {
      const newCatArray = []
      prod.categories.forEach(id => {
        const obj = categories.find(cat => id === cat.id)
        newCatArray.push(obj)
      })
      return {
        ...prod,
        categories: newCatArray
      }
    })

    await index.saveObjects(products).wait();

    res = await index.search("");
  } catch (err) {
    console.log(err)
  }
})();
