// packages
import dotenv from "dotenv";
dotenv.config();

// imports
import User from "../../models/user.js";

// init
const url = process.env.API_URL;

const addImage = async (req, res) => {
  try {
    const userId = req.userId;
    const imagePath = req.file.path;
    const existingUser = await User.findOne({ _id: userId });
    if (existingUser) {
      await User.updateOne({ _id: userId }, { $set: { image: imagePath } });
      if (path.join(`${url}/images/portfoilo`, "simple.jpg") !== imagePath) {
        fs.unlinkSync(path.join(__dirname, imagePath));
      }
      return res.status(200).json({ message: "image added successfuly" });
    } else {
      return res.status(400).json({ message: "user not exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const userData = async (req, res) => {
  try {
    const userId = req.userId;

    const existingUser = await User.findOne(
      { _id: userId },
      {
        name: 1,
        email: 1,
        gender: 1,
        image: 1,
        type: 1,
        address: 1,
        phone: 1,
      }
    );
    if (existingUser) {
      return res.status(200).json({ message: existingUser });
    } else {
      return res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const editUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, gender, image, type, address, phone } = req.body;
    let query = {};

    if (name) {
      query.name = name;
    }
    if (email) {
      query.email = email;
    }
    if (gender) {
      query.gender = gender;
    }
    if (image) {
      query.image = image;
    }
    if (type) {
      query.type = type;
    }
    if (address) {
      query.address = address;
    }
    if (phone) {
      query.phone = phone;
    }
    await User.updateOne({ _id: userId }, { $set: query });

    return res.status(200).json({ message: "User data updated successfuly" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { addImage, userData, editUserData };
