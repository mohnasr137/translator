// imports
import User from "../../models/user.js";

// controllers
const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    const existingUser = await User.findById(userId).populate("cart");

    if (!existingUser) {
      return res.status(400).json({ message: "user not exist" });
    }

    return res.status(200).json({ list: existingUser.cart });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const existingUser = await User.findById(userId).populate("favorite");

    if (!existingUser) {
      return res.status(400).json({ message: "user not exist" });
    }

    return res.status(200).json({ list: existingUser.favorite });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(400).json({ message: "user not exist" });
    }

    const list = existingUser.cart;
    if (!list.includes(productId)) {
      list.push(productId);
    }

    await User.updateOne({ _id: userId }, { $set: { cart: list } });
    return res.status(200).json({ message: "add to cart successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(400).json({ message: "user not exist" });
    }

    const list = existingUser.favorite;
    if (!list.includes(productId)) {
      list.push(productId);
    }

    await User.updateOne({ _id: userId }, { $set: { favorite: list } });
    return res.status(200).json({ message: "add to favorite successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(400).json({ message: "user not exist" });
    }

    const updatedList = existingUser.cart.filter(
      (id) => id.toString() !== productId
    );
    await User.updateOne({ _id: userId }, { $set: { cart: updatedList } });

    return res.status(200).json({ message: "delete from cart successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(400).json({ message: "user not exist" });
    }

    const updatedList = existingUser.favorite.filter(
      (id) => id.toString() !== productId
    );
    await User.updateOne({ _id: userId }, { $set: { favorite: updatedList } });

    return res
      .status(200)
      .json({ message: "delete from favorite successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
  getCart,
  getFavorite,
  addCart,
  addFavorite,
  deleteCart,
  deleteFavorite,
};