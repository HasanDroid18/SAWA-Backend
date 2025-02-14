const User = require("../models/usersModel");
const Post = require("../models/postsModel");
const Donation = require("../models/donationModel");
const axios = require("axios");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalDonations = await Donation.countDocuments();

    // Fetch hospitals data from external API
    const response = await axios.get(
      "https://mophapp.tedmob.com/api/hospitals"
    );
    const hospitals = response.data;
    const totalHospitals = hospitals.length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalDonations,
        totalHospitals,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
