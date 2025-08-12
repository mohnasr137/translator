// packages
import express from "express";

// imports
import {
  allProducts,
  allProductsFilter,
  allCategories,
  allCategoriesFilter,
  allBrands,
  allBrandsFilter,
  getSingleProduct,
  getProductsByCategory,
  getProductsByBrand,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/home/show.js";
import { protect } from "../middlewares/auth.js";

// init
const homeRouter = express.Router();

// routers
// Get all products with pagination, sorting, and selection
homeRouter.get("/products", protect, allProducts);

// Advanced filtering with search, brand, category, etc.
homeRouter.post("/productsFilter", protect, allProductsFilter);

// Get all categories or category names only
homeRouter.get("/categories", protect, allCategories);
homeRouter.get("/categories/names", protect, allCategoriesFilter); // For when name filter is needed
homeRouter.get("/brands", protect, allBrands);
homeRouter.get("/brands/names", protect, allBrandsFilter); // For when name filter is needed

// Get single product by ID
homeRouter.get("/products/:id", protect, getSingleProduct);

// Get products by category
homeRouter.get("/products/category/:category", protect, getProductsByCategory);
homeRouter.get("/products/brand/:brand", getProductsByBrand);

// Add new product (simulated)
homeRouter.post("/products", protect, addProduct);

// Update product (supports both PUT and PATCH)
homeRouter.put("/products/:id", protect, updateProduct);
homeRouter.patch("/products/:id", protect, updateProduct);

// Delete product (simulated)
homeRouter.delete("/products/:id", protect, deleteProduct);

export default homeRouter;
