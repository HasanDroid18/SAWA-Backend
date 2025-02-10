const Joi = require("joi");

exports.signupSchema = Joi.object({
  fullName: Joi.string().min(3).max(50).trim().required(),
  phoneNumber: Joi.string()
    .pattern(/^\d{8}$/) // Ensures phone number is exactly 8 digits
    .trim() // Removes spaces before and after the string
    .required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string()
    .required()
    .pattern(
      new RegExp(
        '^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z0-9!@#$%^&*(),.?":{}|<>]{8,}$'
      )
    ), // Ensures password has a special character
});

exports.signinSchema = Joi.object({
  email: Joi.string().min(6).max(60).trim().required().email(), // Allow all TLDs
  password: Joi.string()
    .required()
    .pattern(
      new RegExp(
        '^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z0-9!@#$%^&*(),.?":{}|<>]{8,}$'
      )
    ),
});

exports.acceptCodeSchema = Joi.object({
  email: Joi.string().min(6).max(60).required().trim().email(), // Allow all TLDs
  providedCode: Joi.number().required(),
});

exports.changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .pattern(
      new RegExp(
        '^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z0-9!@#$%^&*(),.?":{}|<>]{8,}$'
      )
    ),
  oldPassword: Joi.string()
    .required()
    .pattern(
      new RegExp(
        '^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z0-9!@#$%^&*(),.?":{}|<>]{8,}$'
      )
    ),
});

exports.acceptFPCodeSchema = Joi.object({
  email: Joi.string().min(6).max(60).trim().required().email(), // Allow all TLDs
  providedCode: Joi.string().required(), // Change to string instead of number
  newPassword: Joi.string()
    .required()
    .pattern(
      new RegExp(
        '^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z0-9!@#$%^&*(),.?":{}|<>]{8,}$'
      )
    ),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Confirm password must match new password",
    }),
});

exports.createPostSchema = Joi.object({
  title: Joi.string().min(3).max(60).required(),
  description: Joi.string().min(3).max(600).required(),
  userId: Joi.string().required(),
  images: Joi.array().items(Joi.string()).required(), // Add images field
});
