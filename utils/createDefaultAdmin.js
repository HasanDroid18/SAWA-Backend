const User = require("../models/usersModel");
const { doHash } = require("../utils/hashing");

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ Role: "Admin" });
    if (!existingAdmin) {
      const hashedPassword = await doHash("Admin@1234", 12); // Replace with a secure password
      const admin = new User({
        fullName: "Admin",
        phoneNumber: "000000000",
        email: "admin@gmail.com",
        password: hashedPassword,
        Role: "Admin",
      });
      await admin.save();
      console.log("Default admin created successfully");
    } else {
      console.log("Admin already exists");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

module.exports = createDefaultAdmin;
