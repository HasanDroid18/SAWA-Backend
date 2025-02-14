const express = require("express");
const authController = require("../controllers/authController");
const { identifier } = require("../middlewares/identification");
const checkRole = require("../middlewares/roleCheck");
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/signout", authController.signout);

router.get(
  "/users",
  identifier,
  checkRole(["Admin"]),
  authController.getAllUsers
); // Route to get all users
router.get(
  "/users/:id",
  identifier,
  checkRole(["Admin", "SubAdmin"]),
  authController.getUserById
); // Route to get a single user by ID
router.delete(
  "/delete-user/:id",
  identifier,
  checkRole(["Admin"]),
  authController.deleteUser
); // Route to delete a user by ID
router.patch(
  "/update-user-role/:id",
  identifier,
  checkRole(["Admin"]),
  authController.promoteOrDemoteUser
); // Route to promote or demote a user

router.patch("/change-password", identifier, authController.changePassword);
router.patch(
  "/send-forgot-password-code",
  authController.sendForgotPasswordCode
);
router.patch(
  "/verify-forgot-password-code",
  authController.verifyForgotPasswordCode
);

module.exports = router;
