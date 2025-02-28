const User = require("../models/usersModel");
const upload = require("../config/multerProfileImages");
const fs = require("fs");
const path = require("path");

exports.updateProfile = (req, res) => {
  upload.single("userImage")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { userId } = req.user;
    const { fullName, phoneNumber, DateOfBirth, address, bloodType } = req.body;
    const userImage = req.file ? req.file.path : null;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      user.fullName = fullName || user.fullName;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.DateOfBirth = DateOfBirth || user.DateOfBirth;
      user.address = address || user.address;
      user.bloodType = bloodType || user.bloodType;

      if (userImage) {
        // Delete old profile image if exists
        if (user.userImage) {
          const oldImagePath = path.join(__dirname, "..", user.userImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlink(oldImagePath, (err) => {
              if (err) {
                console.error("Error deleting old profile image:", err);
              }
            });
          }
        }
        user.userImage = userImage;
      }

      const updatedUser = await user.save();
      res
        .status(200)
        .json({ success: true, message: "Profile updated", data: updatedUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
};
