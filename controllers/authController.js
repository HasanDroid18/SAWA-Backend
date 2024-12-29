const jwt = require('jsonwebtoken');
const {
	signupSchema,
	signinSchema,
	acceptCodeSchema,
	changePasswordSchema,
	acceptFPCodeSchema,
} = require('../middlewares/validator');
const User = require('../models/usersModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require('../middlewares/sendMail');

exports.signup = async (req, res) => {
    const { fullName, phoneNumber, email, password } = req.body;

    try {
        // Validate fullName, phoneNumber, DateOfBirth, email, password using signupSchema
        const { error, value } = signupSchema.validate({
            fullName,
            phoneNumber,
            email,
            password
        });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        // Check if user already exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ success: false, message: 'User already exists!' });
        }

        // Check if user already exists by phoneNumber
        const existingPhone = await User.findOne({ phoneNumber });
        if (existingPhone) {
            return res.status(401).json({ success: false, message: 'Phone number already in use!' });
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
            message: 'Your account has been created successfully',
            result,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error!' });
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

		const existingUser = await User.findOne({ email }).select('+password');
		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}
		const result = await doHashValidation(password, existingUser.password);
		if (!result) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials!' });
		}
		const token = jwt.sign(
			{
				userId: existingUser._id,
				email: existingUser.email,
			},
			process.env.TOKEN_SECRET,
			{
				expiresIn: '8h',
			}
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000),
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})
			.json({
				success: true,
				token,
				message: 'logged in successfully',
			});
	} catch (error) {
		console.log(error);
	}
};

exports.signout = async (req, res) => {
	res
		.clearCookie('Authorization')
		.status(200)
		.json({ success: true, message: 'logged out successfully' });
};

// exports.sendVerificationCode = async (req, res) => {
// 	const { email } = req.body;
// 	try {
// 		const existingUser = await User.findOne({ email });
// 		if (!existingUser) {
// 			return res
// 				.status(404)
// 				.json({ success: false, message: 'User does not exists!' });
// 		}
// 		if (existingUser.verified) {
// 			return res
// 				.status(400)
// 				.json({ success: false, message: 'You are already verified!' });
// 		}

// 		const codeValue = Math.floor(Math.random() * 1000000).toString();
// 		let info = await transport.sendMail({
// 			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
// 			to: existingUser.email,
// 			subject: 'verification code',
// 			html: '<h1>' + codeValue + '</h1>',
// 		});

// 		if (info.accepted[0] === existingUser.email) {
// 			const hashedCodeValue = hmacProcess(
// 				codeValue,
// 				process.env.HMAC_VERIFICATION_CODE_SECRET
// 			);
// 			existingUser.verificationCode = hashedCodeValue;
// 			existingUser.verificationCodeValidation = Date.now();
// 			await existingUser.save();
// 			return res.status(200).json({ success: true, message: 'Code sent!' });
// 		}
// 		res.status(400).json({ success: false, message: 'Code sent failed!' });
// 	} catch (error) {
// 		console.log(error);
// 	}
// };

// exports.verifyVerificationCode = async (req, res) => {
// 	const { email, providedCode } = req.body;
// 	try {
// 		const { error, value } = acceptCodeSchema.validate({ email, providedCode });
// 		if (error) {
// 			return res
// 				.status(401)
// 				.json({ success: false, message: error.details[0].message });
// 		}

// 		const codeValue = providedCode.toString();
// 		const existingUser = await User.findOne({ email }).select(
// 			'+verificationCode +verificationCodeValidation'
// 		);

// 		if (!existingUser) {
// 			return res
// 				.status(401)
// 				.json({ success: false, message: 'User does not exists!' });
// 		}
// 		if (existingUser.verified) {
// 			return res
// 				.status(400)
// 				.json({ success: false, message: 'you are already verified!' });
// 		}

// 		if (
// 			!existingUser.verificationCode ||
// 			!existingUser.verificationCodeValidation
// 		) {
// 			return res
// 				.status(400)
// 				.json({ success: false, message: 'something is wrong with the code!' });
// 		}

// 		if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
// 			return res
// 				.status(400)
// 				.json({ success: false, message: 'code has been expired!' });
// 		}

// 		const hashedCodeValue = hmacProcess(
// 			codeValue,
// 			process.env.HMAC_VERIFICATION_CODE_SECRET
// 		);

// 		if (hashedCodeValue === existingUser.verificationCode) {
// 			existingUser.verified = true;
// 			existingUser.verificationCode = undefined;
// 			existingUser.verificationCodeValidation = undefined;
// 			await existingUser.save();
// 			return res
// 				.status(200)
// 				.json({ success: true, message: 'your account has been verified!' });
// 		}
// 		return res
// 			.status(400)
// 			.json({ success: false, message: 'unexpected occured!!' });
// 	} catch (error) {
// 		console.log(error);
// 	}
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
		// 	return res
		// 		.status(401)
		// 		.json({ success: false, message: 'You are not verified user!' });
		// }
		const existingUser = await User.findOne({ _id: userId }).select(
			'+password'
		);
		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}
		const result = await doHashValidation(oldPassword, existingUser.password);
		if (!result) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials!' });
		}
		const hashedPassword = await doHash(newPassword, 12);
		existingUser.password = hashedPassword;
		await existingUser.save();
		return res
			.status(200)
			.json({ success: true, message: 'Password updated!!' });
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
            return res.status(404).json({ success: false, message: 'User does not exist!' });
        }

        // Generate a random code
        const codeValue = Math.floor(Math.random() * 1000000).toString();

        // Send email
        const info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: 'Forgot password code',
            html: `<h1>${codeValue}</h1>`,
        });

        if (info.accepted.includes(existingUser.email)) {
            // Check and log the HMAC secret for debugging
            const secretKey = process.env.HMAC_VERIFICATION_CODE_SECRET;
            if (!secretKey) {
                throw new Error('HMAC_VERIFICATION_CODE_SECRET is not defined.');
            }

            // Generate HMAC for the code
            const hashedCodeValue = hmacProcess(codeValue, secretKey);

            // Update user document
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();

            // Respond success
            return res.status(200).json({ success: true, message: 'Code sent!' });
        }

        // Respond failure if email not accepted
        return res.status(400).json({ success: false, message: 'Code sending failed!' });
    } catch (error) {
        console.error('Error in sendForgotPasswordCode:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};


exports.verifyForgotPasswordCode = async (req, res) => {
	const { email, providedCode, newPassword } = req.body;
	try {
		const { error, value } = acceptFPCodeSchema.validate({
			email,
			providedCode,
			newPassword,
		});
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		const codeValue = providedCode.toString();
		const existingUser = await User.findOne({ email }).select(
			'+forgotPasswordCode +forgotPasswordCodeValidation'
		);

		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exists!' });
		}

		if (
			!existingUser.forgotPasswordCode ||
			!existingUser.forgotPasswordCodeValidation
		) {
			return res
				.status(400)
				.json({ success: false, message: 'something is wrong with the code!' });
		}

		if (
			Date.now() - existingUser.forgotPasswordCodeValidation >
			5 * 60 * 1000
		) {
			return res
				.status(400)
				.json({ success: false, message: 'code has been expired!' });
		}

		const hashedCodeValue = hmacProcess(
			codeValue,
			process.env.HMAC_VERIFICATION_CODE_SECRET
		);

		if (hashedCodeValue === existingUser.forgotPasswordCode) {
			const hashedPassword = await doHash(newPassword, 12);
			existingUser.password = hashedPassword;
			existingUser.forgotPasswordCode = undefined;
			existingUser.forgotPasswordCodeValidation = undefined;
			await existingUser.save();
			return res
				.status(200)
				.json({ success: true, message: 'Password updated!!' });
		}
		return res
			.status(400)
			.json({ success: false, message: 'unexpected occured!!' });
	} catch (error) {
		console.log(error);
	}
};