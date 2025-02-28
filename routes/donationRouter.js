const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const upload = require("../config/multer");
const { identifier } = require("../middlewares/identification");
const checkRole = require("../middlewares/roleCheck");

// Create a new donation (Admin and SubAdmin)
router.post(
  "/create-donation",
  identifier,
  checkRole(["Admin", "SubAdmin"]),
  upload.single("donationItemImage"),
  (req, res, next) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }
    next();
  },
  donationController.createDonation
);

// Get all donations (Public)
router.get("/get-all-donations", donationController.getAllDonations);

// Get a single donation by ID (Public)
router.get("/get-donation/:id", donationController.getDonationById);

// Get all donation requests (Admin)
router.get(
  "/get-all-requests",
  identifier,
  donationController.getAllRequests
);

// Delete a donation by ID (Admin and SubAdmin)
router.delete(
  "/delete-donation/:id",
  identifier,
  checkRole(["Admin", "SubAdmin"]),
  donationController.deleteDonation
);

// Update a donation by ID (Admin and SubAdmin)
router.put(
  "/update-donation/:id",
  identifier,
  checkRole(["Admin", "SubAdmin"]),
  upload.single("donationItemImage"),
  (req, res, next) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }
    next();
  },
  donationController.updateDonation
);

// Request a donation (User)
router.post(
  "/request-donation/:id/request",
  identifier,
  donationController.requestDonation
);

// Accept a requested donation (Admin)
router.post(
  "/accept-request/:id",
  identifier,
  donationController.acceptRequest
);

// Reject a requested donation (Admin)
router.post(
  "/reject-request/:id",
  identifier,
  donationController.rejectRequest
);

// Donate for a donation item (User)
// router.post(
//   "/donate/:id/donate",
//   upload.single("invoiceImage"),
//   donationController.donateForDonation
// );

module.exports = router;
