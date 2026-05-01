import SibApiV3Sdk from "sib-api-v3-sdk";
import { ApiError } from "../utils/ApiError.js";

export const sendEmail = async ({ to, subject, htmlTamplete }) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;

    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
      email: "noreply@skayshare.com",
      name: "SkayShare",
    };

    const receivers = [{ email: to }];

    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject,
      htmlContent: htmlTamplete,
    });

  } catch (err) {
    console.error("❌ Email Error:", err.response?.body || err.message);
    throw new ApiError(500, "Unable to Send Email");
  }
};