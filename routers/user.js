// packages
import express from "express";

// imports
import {
  getCart,
  getFavorite,
  addCart,
  addFavorite,
  deleteCart,
  deleteFavorite,
} from "../controllers/home/bacicUser.js";
import { protect } from "../middlewares/auth.js";

// init
const userRouter = express.Router();

// routers
userRouter.get("/getCart", protect, getCart);
userRouter.get("/getFavorite", protect, getFavorite);
userRouter.post("/addCart", protect, addCart);
userRouter.post("/addFavorite", protect, addFavorite);
userRouter.delete("/deleteCart", protect, deleteCart);
userRouter.delete("/deleteFavorite", protect, deleteFavorite);

export default userRouter;
