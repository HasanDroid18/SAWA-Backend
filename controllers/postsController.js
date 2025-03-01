const { createPostSchema } = require("../middlewares/validator");
const Post = require("../models/postsModel");
const upload = require("../config/multerPostImages");
const fs = require("fs");
const path = require("path");

exports.getPosts = async (req, res) => {
  const { page } = req.query;
  const postsPerPage = 10;

  try {
    let pageNum = 0;
    if (page <= 1) {
      pageNum = 0;
    } else {
      pageNum = page - 1;
    }
    const result = await Post.find()
      .sort({ createdAt: -1 })
      .skip(pageNum * postsPerPage)
      .limit(postsPerPage)
      .populate({
        path: "userId",
        select: "fullName",
      });
    res.status(200).json({ success: true, message: "posts", data: result });
  } catch (error) {
    console.log(error);
  }
};

exports.singlePost = async (req, res) => {
  const { id } = req.params;

  try {
    const existingPost = await Post.findById(id).populate({
      path: "userId",
      select: "fullName",
    });
    if (!existingPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post unavailable" });
    }

    // Increment views counter
    existingPost.views += 1;
    await existingPost.save();

    res
      .status(200)
      .json({ success: true, message: "single post", data: existingPost });
  } catch (error) {
    console.log(error);
  }
};

exports.createPost = async (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const { title, description } = req.body;
    const { userId } = req.user;
    const images = req.files ? req.files.map((file) => file.path) : [];
    try {
      const { error, value } = createPostSchema.validate({
        title,
        description,
        userId,
        images,
      });
      if (error) {
        return res
          .status(401)
          .json({ success: false, message: error.details[0].message });
      }

      const result = await Post.create({
        title,
        description,
        userId,
        images,
      });
      res.status(201).json({ success: true, message: "created", data: result });
    } catch (error) {
      console.log(error);
    }
  });
};

exports.updatePost = async (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const { id } = req.params;
    const { title, description } = req.body;
    const { userId } = req.user;
    const images = req.files ? req.files.map((file) => file.path) : [];
    try {
      const { error, value } = createPostSchema.validate({
        title,
        description,
        userId,
        images,
      });
      if (error) {
        return res
          .status(401)
          .json({ success: false, message: error.details[0].message });
      }

      const existingPost = await Post.findById(id);
      if (!existingPost) {
        return res
          .status(404)
          .json({ success: false, message: "Post unavailable" });
      }
      if (existingPost.userId.toString() !== userId) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      // Delete old images if new images are uploaded
      if (images.length > 0) {
        existingPost.images.forEach((imagePath) => {
          const fullPath = path.join(__dirname, "..", imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlink(fullPath, (err) => {
              if (err) {
                console.error("Error deleting old image:", err);
              }
            });
          }
        });
        existingPost.images = images;
      }

      existingPost.title = title;
      existingPost.description = description;

      const result = await existingPost.save();
      res.status(200).json({ success: true, message: "Updated", data: result });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
};

exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  try {
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post already unavailable" });
    }
    if (existingPost.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Delete associated images
    existingPost.images.forEach((imagePath) => {
      const fullPath = path.join(__dirname, "..", imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error("Error deleting image:", err);
          }
        });
      }
    });

    await Post.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: "deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
