const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { identifier } = require("../middlewares/identification");
const checkRole = require("../middlewares/roleCheck");

// Get dashboard statistics (Admin-only)
router.get(
  "/dashboard",
  identifier,
  checkRole(["Admin", "SubAdmin"]),
  dashboardController.getDashboardStats
);

// Get user post counts (Admin-only)
router.get(
  "/user-post-counts",
  identifier,
  checkRole(["Admin", "SubAdmin"]),
  dashboardController.getUserPostCounts
);


module.exports = router;
