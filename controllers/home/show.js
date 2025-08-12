// packages
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// init
const url = process.env.API_URL;
const DUMMY_JSON_BASE_URL = "https://dummyjson.com";

// routers
const allProducts = async (req, res) => {
  try {
    let { skip = 0, limit = 10, sortBy, order, select } = req.query;

    // Build query parameters
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (sortBy && order) {
      params.append("sortBy", sortBy);
      params.append("order", order);
    }

    if (select) {
      params.append("select", select);
    }

    const response = await axios.get(
      `${DUMMY_JSON_BASE_URL}/products?${params}`
    );
    return res.status(200).json({
      list: response.data.products,
      total: response.data.total,
      skip: response.data.skip,
      limit: response.data.limit,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const allProductsFilter = async (req, res) => {
  try {
    const {
      skip = 0,
      search,
      brand,
      category,
      rating,
      price,
      discount,
      popular,
      limit = 10,
    } = req.body;

    let apiUrl = `${DUMMY_JSON_BASE_URL}/products`;
    let params = new URLSearchParams({
      skip: (skip * 10).toString(),
      limit: limit.toString(),
    });

    // Handle search functionality
    if (search) {
      apiUrl = `${DUMMY_JSON_BASE_URL}/products/search`;
      params.append("q", search);
    }

    // Handle category filtering
    if (category) {
      apiUrl = `${DUMMY_JSON_BASE_URL}/products/category/${category}`;
    }

    // Handle sorting
    if (rating) {
      params.append("sortBy", "rating");
      params.append("order", rating === "up" ? "asc" : "desc");
    } else if (price) {
      params.append("sortBy", "price");
      params.append("order", price === "up" ? "asc" : "desc");
    } else if (discount) {
      params.append("sortBy", "discountPercentage");
      params.append("order", discount === "up" ? "asc" : "desc");
    } else if (popular) {
      params.append("sortBy", "rating");
      params.append("order", "desc");
    }

    const response = await axios.get(`${apiUrl}?${params}`);
    let products = response.data.products || [];

    // Client-side filtering for brand (since DummyJSON doesn't support brand filtering directly)
    if (brand) {
      products = products.filter(
        (product) =>
          product.brand &&
          product.brand.toLowerCase().includes(brand.toLowerCase())
      );
    }

    if (products.length === 0) {
      return res.status(404).json({ message: "No results found." });
    } else {
      return res.status(200).json({
        list: products,
        total: response.data.total || products.length,
        skip: response.data.skip || skip,
        limit: response.data.limit || limit,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const allCategories = async (req, res) => {
  try {
    // Get all categories with details
    const response = await axios.get(
      `${DUMMY_JSON_BASE_URL}/products/categories`
    );
    const list = response.data;

    await Promise.all(
      list.map(async (item) => {
        const images = await axios.get(item.url);
        item.image = images.data.products[0].images[0];
      })
    );

    if (list.length === 0) {
      return res.status(404).json({ message: "there is no result" });
    } else {
      return res.status(200).json({ list });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const allBrands = async (req, res) => {
  try {
    const emojiMap = {
      Essence: "💄",
      "Glamour Beauty": "✨",
      "Velvet Touch": "🪞",
      "Chic Cosmetics": "👛",
      "Nail Couture": "💅",
      "Calvin Klein": "👔",
      Chanel: "👗",
      Dior: "👜",
      "Dolce & Gabbana": "👠",
      Gucci: "🕶️",
      "Annibale Colombo": "🛋️",
      "Furniture Co.": "🪑",
      Knoll: "🏢",
      "Bath Trends": "🛁",
    };

    const response = await axios.get(`${DUMMY_JSON_BASE_URL}/products`);
    const list = response.data.products;

    const brands = list.map((item) => item.brand);
    const uniqueBrands = [...new Set(brands)];

    const filteredBrands = uniqueBrands.filter(
      (brand) => brand !== null && brand !== undefined
    );

    const brandWithEmoji = filteredBrands.map((brand) => ({
      name: brand,
      emoji: emojiMap[brand] || "",
    }));

    if (list.length === 0) {
      return res.status(404).json({ message: "there is no result" });
    } else {
      return res.status(200).json({ list: brandWithEmoji });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const allCategoriesFilter = async (req, res) => {
  try {
    // Get category list (just names)
    const response = await axios.get(
      `${DUMMY_JSON_BASE_URL}/products/category-list`
    );
    const list = response.data.map((categoryName) => ({
      name: categoryName,
    }));
    return res.status(200).json({ list });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const allBrandsFilter = async (req, res) => {
  try {
    const response = await axios.get(`${DUMMY_JSON_BASE_URL}/products`);
    const list = response.data.products.map((brandName) => ({
      name: brandName.brand,
    }));
    const uniqueBrands = [...new Set(list)];
    const filteredBrands = uniqueBrands.filter(
      (brand) => brand !== null && brand !== undefined
    );
    return res.status(200).json({ list: filteredBrands });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${DUMMY_JSON_BASE_URL}/products/${id}`);
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    let { skip = 0, limit = 10 } = req.query;

    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await axios.get(
      `${DUMMY_JSON_BASE_URL}/products/category/${category}?${params}`
    );
    return res.status(200).json({
      list: response.data.products,
      total: response.data.total,
      skip: response.data.skip,
      limit: response.data.limit,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;
    let { skip = 0, limit = 10 } = req.query;

    // Input validation
    if (!brand) {
      return res.status(400).json({ message: "Brand parameter is required" });
    }

    skip = parseInt(skip);
    limit = parseInt(limit);

    if (isNaN(skip) || isNaN(limit) || skip < 0 || limit <= 0) {
      return res.status(400).json({ message: "Invalid skip or limit value" });
    }

    // Fetch ALL products
    const response = await axios.get(`${DUMMY_JSON_BASE_URL}/products`);
    const allProducts = response.data?.products || [];

    // Filter by brand (case-insensitive)
    const filteredProducts = allProducts.filter(
      (product) => product.brand?.toLowerCase() === brand.toLowerCase()
    );

    // Apply pagination
    const paginatedProducts = filteredProducts.slice(skip, skip + limit);

    if (paginatedProducts.length === 0) {
      return res.status(404).json({ message: "No products found for this brand" });
    }

    return res.status(200).json({
      list: paginatedProducts,
      total: filteredProducts.length, // Total matching products (not just paginated count)
      skip,
      limit,
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return res.status(500).json({
      message: error.response?.data?.message || "Failed to fetch products",
    });
  }
};

const addProduct = async (req, res) => {
  try {
    const productData = req.body;
    const response = await axios.post(
      `${DUMMY_JSON_BASE_URL}/products/add`,
      productData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.status(201).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const method = req.method.toLowerCase() === "patch" ? "PATCH" : "PUT";

    const response = await axios({
      method,
      url: `${DUMMY_JSON_BASE_URL}/products/${id}`,
      data: updateData,
      headers: { "Content-Type": "application/json" },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(
      `${DUMMY_JSON_BASE_URL}/products/${id}`
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
  allProducts,
  allProductsFilter,
  allCategories,
  allCategoriesFilter,
  getProductsByBrand,
  allBrands,
  allBrandsFilter,
  getSingleProduct,
  getProductsByCategory,
  addProduct,
  updateProduct,
  deleteProduct,
};
