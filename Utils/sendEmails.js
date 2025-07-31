import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Or 'outlook', 'smtp.mailtrap.io' etc.
            auth: {
                user: process.env.EMAIL_USER, // Your email address from .env
                pass: process.env.EMAIL_PASS, // Your app password from .env
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Verification Code',
            html: `<p>Your One-Time Password (OTP) for ChatApp is: <strong>${otp}</strong></p>
                   <p>This code is valid for 1 hour.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        // Re-throw the error so the caller (userController) can catch it
        throw new Error('Failed to send OTP email.');
    }
};

// THIS IS THE CRUCIAL EXPORT STATEMENT FOR NAMED IMPORTS
export { sendOtpEmail };