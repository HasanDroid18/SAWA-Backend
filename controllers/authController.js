const jwt = require("jsonwebtoken");
const {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} = require("../middlewares/validator");
const User = require("../models/usersModel");
const { doHash, doHashValidation, hmacProcess } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");

exports.signup = async (req, res) => {
  const { fullName, phoneNumber, email, password } = req.body;

  try {
    // Validate fullName, phoneNumber, DateOfBirth, email, password using signupSchema
    const { error, value } = signupSchema.validate({
      fullName,
      phoneNumber,
      email,
      password,
    });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    // Check if user already exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User already exists!" });
    }

    // Check if user already exists by phoneNumber
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res
        .status(401)
        .json({ success: false, message: "Phone number already in use!" });
    }

    // Hash the password
    const hashedPassword = await doHash(password, 12);

    // Create new user object
    const newUser = new User({
      fullName,
      phoneNumber,
      email,
      password: hashedPassword,
    });

    // Save new user to database
    const result = await newUser.save();
    result.password = undefined; // Don't send back password in response

    // Respond with success message and user details (excluding password)
    res.status(201).json({
      success: true,
      message: "Your account has been created successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }
    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }
    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        role: existingUser.Role,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        success: true,
        token,
        userId: existingUser._id,
        role: existingUser.Role,
        fullName: existingUser.fullName,
        phoneNumber: existingUser.phoneNumber,
        email: existingUser.email,
        message: "logged in successfully",
      });
  } catch (error) {
    console.log(error);
  }
};

exports.signout = async (req, res) => {
  res
    .clearCookie("Authorization")
    .status(200)
    .json({ success: true, message: "logged out successfully" });
};

// exports.sendVerificationCode = async (req, res) => {
//  const { email } = req.body;
//  try {
//    const existingUser = await User.findOne({ email });
//    if (!existingUser) {
//      return res
//        .status(404)
//        .json({ success: false, message: 'User does not exists!' });
//    }
//    if (existingUser.verified) {
//      return res
//        .status(400)
//        .json({ success: false, message: 'You are already verified!' });
//    }

//    const codeValue = Math.floor(Math.random() * 1000000).toString();
//    let info = await transport.sendMail({
//      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
//      to: existingUser.email,
//      subject: 'verification code',
//      html: '<h1>' + codeValue + '</h1>',
//    });

//    if (info.accepted[0] === existingUser.email) {
//      const hashedCodeValue = hmacProcess(
//        codeValue,
//        process.env.HMAC_VERIFICATION_CODE_SECRET
//      );
//      existingUser.verificationCode = hashedCodeValue;
//      existingUser.verificationCodeValidation = Date.now();
//      await existingUser.save();
//      return res.status(200).json({ success: true, message: 'Code sent!' });
//    }
//    res.status(400).json({ success: false, message: 'Code sent failed!' });
//  } catch (error) {
//    console.log(error);
//  }
// };

// exports.verifyVerificationCode = async (req, res) => {
//  const { email, providedCode } = req.body;
//  try {
//    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
//    if (error) {
//      return res
//        .status(401)
//        .json({ success: false, message: error.details[0].message });
//    }

//    const codeValue = providedCode.toString();
//    const existingUser = await User.findOne({ email }).select(
//      '+verificationCode +verificationCodeValidation'
//    );

//    if (!existingUser) {
//      return res
//        .status(401)
//        .json({ success: false, message: 'User does not exists!' });
//    }
//    if (existingUser.verified) {
//      return res
//        .status(400)
//        .json({ success: false, message: 'you are already verified!' });
//    }

//    if (
//      !existingUser.verificationCode ||
//      !existingUser.verificationCodeValidation
//    ) {
//      return res
//        .status(400)
//        .json({ success: false, message: 'something is wrong with the code!' });
//    }

//    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
//      return res
//        .status(400)
//        .json({ success: false, message: 'code has been expired!' });
//    }

//    const hashedCodeValue = hmacProcess(
//      codeValue,
//      process.env.HMAC_VERIFICATION_CODE_SECRET
//    );

//    if (hashedCodeValue === existingUser.verificationCode) {
//      existingUser.verified = true;
//      existingUser.verificationCode = undefined;
//      existingUser.verificationCodeValidation = undefined;
//      await existingUser.save();
//      return res
//        .status(200)
//        .json({ success: true, message: 'your account has been verified!' });
//    }
//    return res
//      .status(400)
//      .json({ success: false, message: 'unexpected occured!!' });
//  } catch (error) {
//    console.log(error);
//  }
// };

exports.changePassword = async (req, res) => {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    // if (!verified) {
    //  return res
    //    .status(401)
    //    .json({ success: false, message: 'You are not verified user!' });
    // }
    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }
    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }
    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res
      .status(200)
      .json({ success: true, message: "Password updated!!" });
  } catch (error) {
    console.log(error);
  }
};

exports.sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }

    // Generate a random 5-digit code (between 10000 and 99999)
    const codeValue = Math.floor(Math.random() * 90000) + 10000; // Generates a 5-digit code

    // Send email with the generated code
    const info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot password code",
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                color: #333;
              }
              .content {
                text-align: center;
                font-size: 18px;
                margin: 20px 0;
              }
              .code {
                font-size: 24px;
                font-weight: bold;
                color: #4CAF50;
              }
              .footer {
                text-align: center;
                font-size: 14px;
                color: #888;
                margin-top: 30px;
              }
              .footer a {
                color: #4CAF50;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Forgot Password</h1>
              </div>
              <div class="content">
                <p>We received a request to reset your password. Please use the following code to proceed:</p>
                <div class="code">${codeValue}</div>
              </div>
              <div class="footer">
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>&copy; 2025 SAWA. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>`,
    });

    if (info.accepted.includes(existingUser.email)) {
      // Check and log the HMAC secret for debugging
      const secretKey = process.env.HMAC_VERIFICATION_CODE_SECRET;
      if (!secretKey) {
        throw new Error("HMAC_VERIFICATION_CODE_SECRET is not defined.");
      }

      // Generate HMAC for the code
      const hashedCodeValue = hmacProcess(codeValue.toString(), secretKey);

      // Update user document with hashed code and timestamp
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();

      // Respond success
      return res.status(200).json({ success: true, message: "Code sent!" });
    }

    // Respond failure if email not accepted
    return res
      .status(400)
      .json({ success: false, message: "Code sending failed!" });
  } catch (error) {
    console.error("Error in sendForgotPasswordCode:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword, confirmPassword } = req.body;

  try {
    // Validate request body with updated schema
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
      confirmPassword,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Check if user exists
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }

    // Validate code and its expiration
    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code!" });
    }

    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Code has expired!" });
    }

    // Verify the provided code
    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      // Hash the new password
      const hashedPassword = await doHash(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();

      return res
        .status(200)
        .json({ success: true, message: "Password updated successfully!" });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid verification code!" });
  } catch (error) {
    console.error("Error in verifyForgotPasswordCode:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password from the result
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password"); // Exclude password from the result
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.promoteOrDemoteUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // Expecting role in the request body

  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    // Only allow role changes between "subAdmin" and "user"
    if (role !== "SubAdmin" && role !== "User") {
      return res.status(400).json({ success: false, message: "Invalid role!" });
    }

    // Update user role
    user.Role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role} successfully!`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { fullName, phoneNumber, DateOfBirth, address, bloodType } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    user.fullName = fullName || user.fullName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.DateOfBirth = DateOfBirth || user.DateOfBirth;
    user.address = address || user.address;
    user.bloodType = bloodType || user.bloodType;
    if (req.file) {
      user.userImage = req.file.path; // Get the file path from multer
    }

    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully!", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};
