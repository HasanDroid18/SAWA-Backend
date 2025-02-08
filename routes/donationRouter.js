const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const upload = require("../config/multer");

// Create a new donation (Admin-only)
router.post(
  "/create-donation",
  upload.single("donationItemImage"),
  donationController.createDonation
);

// Get all donations (Public)
router.get("/get-all-donations", donationController.getAllDonations);

// Get a single donation by ID (Public)
router.get("/get-donation/:id", donationController.getDonationById);

// Delete a donation by ID (Admin-only)
router.delete("/delete-donation/:id", donationController.deleteDonation);

// Update a donation by ID (Admin-only)
router.put(
  "/update-donation/:id",
  upload.single("donationItemImage"),
  donationController.updateDonation
);

// Request a donation (User)
// router.post(
//   "/request-donation/:id/request",
//   donationController.requestDonation
// );

// Donate for a donation item (User)
// router.post(
//   "/donate/:id/donate",
//   upload.single("invoiceImage"),
//   donationController.donateForDonation
// );

module.exports = router;
