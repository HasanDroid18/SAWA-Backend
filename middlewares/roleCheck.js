const User = require("../models/usersModel");

const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user || !roles.includes(user.Role)) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

module.exports = checkRole;
