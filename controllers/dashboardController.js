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
    // const response = await axios.get(
    //   "https://mophapp.tedmob.com/api/hospitals"
    // );
    // const hospitals = response.data;
    // const totalHospitals = hospitals.length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalDonations
        // totalHospitals,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserPostCounts = async (req, res) => {
  try {
    const userPostCounts = await Post.aggregate([
      {
        $group: {
          _id: "$userId",
          postCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$user.username",
          fullName: "$user.fullName",
          postCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: userPostCounts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
