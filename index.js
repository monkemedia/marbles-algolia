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
    const brandIds = []


    const addCatIds = (ids) => {
      ids.forEach(id => {
        if(!categoryIds.includes(id)) {
          categoryIds.push(id)
        }
      })
    }

    const addBrandId = (id) => {
      if(!brandIds.includes(id)) {
        brandIds.push(id)
      }
    }

    const getCategories = async (catIds) => {
      const response = await fetch(`${BIG_BASE_URL}/${BIG_STORE_HASH}/${BIG_VERSION}/catalog/categories?id:in=${catIds}&is_visible=true&limit=100`, { 
        method: 'GET', 
        headers: {
          Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': BIG_ACCESS_TOKEN
      
        }
      })

      const data = await response.json()

      return data.data.map(({ id, name, custom_url }) => ({ id, name, url: custom_url.url }))
    }

    const getBrands = async (brandIds) => {
      const response = await fetch(`${BIG_BASE_URL}/${BIG_STORE_HASH}/${BIG_VERSION}/catalog/brands?id:in=${brandIds}`, { 
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
      const response = await fetch(`${BIG_BASE_URL}/${BIG_STORE_HASH}/${BIG_VERSION}/catalog/products/?page=${page}&is_visible=true&include=images`, { 
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
            customer_url: item.custom_url,
            categories: item.categories,
            image: item.images.find(img => img.is_thumbnail)?.url_standard,
            brand: item.brand_id,
            sale_price: item.sale_price,
            price: item.price,
            custom_url: item.custom_url,
            total_sold: item.total_sold
          })

          addCatIds(item.categories)
          addBrandId(item.brand_id)
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
        categories: newCatArray.map(cat => cat.name)
      }
    })

    const brands = await getBrands(brandIds)

    products = products.map(prod => {
      return {
        ...prod,
        brand: brands.find(brand => brand.id === prod.brand)?.name
      }
    })

    await index.saveObjects(products).wait();

    await index.setSettings({
      // searchableAttributes: [
      //   'name',
      //   'categories'
      // ],
      attributesForFaceting: [
        'brand',
        'categories',
      ]
    })

    res = await index.search("");
  } catch (err) {
    console.log(err)
  }
})();
