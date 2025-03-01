const Donation = require("../models/donationModel");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = require("../config/multer");

// Create a new donation (Admin-only)
const createDonation = async (req, res) => {
  try {
    const { donationItemName, donationItemPrice, description, quantity } =
      req.body;

    // Check for duplicate donation item name
    const existingDonation = await Donation.findOne({ donationItemName });
    if (existingDonation) {
      return res
        .status(400)
        .json({ error: "Donation with this name already exists" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Donation item image is required" });
    }

    const donationItemImage = req.file.path; // File path for the image

    const donation = new Donation({
      donationItemName,
      donationItemImage,
      donationItemPrice,
      description,
      quantity,
    });

    await donation.save();
    res.status(201).json(donation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all donations (Public)
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find();
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single donation by ID (Public)
const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }
    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a donation by ID (Admin-only)
const updateDonation = async (req, res) => {
  try {
    const { donationItemName, donationItemPrice, description, quantity } =
      req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    if (req.file) {
      // Check if the old image file exists before deleting
      if (donation.donationItemImage) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          donation.donationItemImage
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error("Error deleting old image:", err);
            }
          });
        } else {
          console.warn("Old image file does not exist, skipping deletion.");
        }
      }

      donation.donationItemImage = req.file.path;
    }

    donation.donationItemName = donationItemName || donation.donationItemName;
    donation.donationItemPrice =
      donationItemPrice || donation.donationItemPrice;
    donation.description = description || donation.description;
    donation.quantity = quantity || donation.quantity;

    await donation.save();
    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestDonation = async (req, res) => {
  try {
    console.log("req.user:", req.user); // Debugging log

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. User not found." });
    }

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    const userId = req.user.userId;
    const userFullName = req.user.fullName || "Unknown"; // Ensure fullName is correctly accessed
    const phoneNumber = req.user.phoneNumber || "Unknown"; // Ensure phoneNumber is correctly accessed
    console.log("User ID:", userId, "Full Name:", userFullName, "Phone Number:", phoneNumber); // Debugging log

    if (donation.requestedBy.some(request => request.userId.toString() === userId)) {
      return res.status(400).json({ error: "You have already requested this donation" });
    }

    donation.requestedBy.push({ userId, fullName: userFullName, phoneNumber });
    await donation.save();

    res.status(200).json({ message: "Donation requested successfully", donation });
  } catch (error) {
    console.error("Error in requestDonation:", error);
    res.status(500).json({ error: error.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    if (donation.quantity <= 0) {
      return res.status(400).json({ error: "No more items available for donation" });
    }

    donation.quantity -= 1;
    donation.requestedBy = []; // Empty the requestedBy array
    await donation.save();

    res.status(200).json({ message: "Donation request accepted", donation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    console.log("Reject request received for ID:", req.params.id);

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      console.log("Donation not found");
      return res.status(404).json({ error: "Donation not found" });
    }

    console.log("Before rejection:", donation.requestedBy);

    // Empty the requestedBy array
    donation.requestedBy = [];

    console.log("After rejection:", donation.requestedBy);

    await donation.save();

    res.status(200).json({ message: "Donation request rejected", donation });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a donation by ID (Admin-only)
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    // Delete associated image file
    if (donation.donationItemImage) {
      const imagePath = path.join(__dirname, "..", donation.donationItemImage);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
        }
      });
    }

    await Donation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Donation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const donations = await Donation.find({ "requestedBy.0": { $exists: true } }).populate('requestedBy.userId', 'fullName email phoneNumber');
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDonation,
  getAllDonations,
  getDonationById,
  deleteDonation,
  updateDonation,
  requestDonation,
  acceptRequest,
  rejectRequest,
  getAllRequests,
};
