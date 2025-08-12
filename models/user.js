import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      required: [true, "Please add a name"],
      maxlength: [20, "Username cannot be more than 20 characters"],
      minlength: [3, "Username cannot be less than 3 characters"],
      match: [/^[A-Za-z0-9]*$/, "Please add a valid name"],

      type: String,
      trim: true,
    },
    phone: {
      required: [true, "Please add a phone"],
      maxlength: [20, "Phone cannot be more than 20 characters"],
      minlength: [3, "Phone cannot be less than 3 characters"],
      match: [/^[0-9]*$/, "Please add a valid phone"],
      type: String,
      trim: true,
    },
    email: {
      required: [true, "Please add a email"],
      maxlength: [50, "Email cannot be more than 50 characters"],
      minlength: [3, "Email cannot be less than 3 characters"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      type: String,
      unique: true,
      trim: true,
    },
    password: {
      required: [true, "Please add a password"],
      maxlength: [250, "Password cannot be more than 250 characters"],
      minlength: [8, "Password cannot be less than 8 characters"],
      match: [
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Please add a valid password",
      ],
      type: String,
      select: false,
    },
    address: {
      type: String,
      default: "not added",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    verify: {
      type: Boolean,
      default: false,
    },
    resetPass: {
      type: Boolean,
      default: false,
    },
    image: {
      require: true,
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    myProduct: [
      {
        type: String,
        trim: true,
      },
    ],
    cart: [
      {
        type: String,
        trim: true,
      },
    ],
    favorite: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
