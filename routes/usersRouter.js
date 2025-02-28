const express = require("express");
const usersController = require("../controllers/usersController");
const { identifier } = require("../middlewares/identification");
const router = express.Router();

router.put("/update-profile", identifier, usersController.updateProfile);

module.exports = router;
