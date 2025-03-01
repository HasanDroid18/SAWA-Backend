const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full Name is required!"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required!"],
      trim: true,
      unique: [true, "Phone Number must be unique!"],
    },
    DateOfBirth: {
      type: Date,
    },
    Role: {
      type: String,
      enum: ["Admin", "SubAdmin", "User"],
      default: "User",
    },
    userImage: {
      type: String, // URL or file path, optional in profile update
    },
    address: {
      type: String, // Optional in profile update
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      trim: true,
      unique: [true, "Email must be unique!"],
      minLength: [5, "Email must have 5 characters!"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password must be provided!"],
      trim: true,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
