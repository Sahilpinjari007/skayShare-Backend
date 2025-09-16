import { ApiError } from "../utils/ApiError.js";
import nodemailer from "nodemailer";

export const sendEmail = async ({
  from = "<noreply@skayshare.com>",
  to,
  subject,
  htmlTamplete,
}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILE_HOSTER,
      port: process.env.MAILE_HOSTER_PORT,
      auth: {
        user: process.env.MAILE_HOST_USER,
        pass: process.env.MAILE_HOST_PASS,
      },
    });

    let info = {
      from: from,
      to: to,
      subject: subject,
      html: htmlTamplete,
    };

    await transporter.sendMail(info);
  } catch (err) {
    console.error("❌ Unable to Send Email!...:", err.message);
    throw new ApiError(500, "Unable to Send Email!...");
  }
};
