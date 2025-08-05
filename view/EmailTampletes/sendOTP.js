export const sendOTP = (OTP) => {
  return `<div style="max-width: 28rem; margin: 0 auto; background-color: white; padding: 2rem; font-family: sans-serif;">

  <div style="text-align: center; margin-bottom: 3rem;">
    <h1 style="font-size: 1.875rem; font-weight: bold; color: black;">skayShare</h1>
  </div>

  <div style="text-align: center;">
    <h2 style="font-size: 1.5rem; font-weight: normal; color: black; line-height: 1.25;">Almost there</h2>

    <p style="color: #4B5563; font-size: 1rem;">Here is your verification code:</p>

    <div style="margin: 2rem 0;">
      <div style="border: 1px solid #D1D5DB; border-radius: 1rem; padding: 1rem 1.5rem; background-color: #F9FAFB;">
        <span style="font-size: 1.25rem; font-family: monospace; letter-spacing: 0.1em; color: black;">${OTP}</span>
      </div>
    </div>

    <p style="color: #4B5563; font-size: 1rem;">This code will be active for 30 minutes.</p>

    <div style="padding-top: 1rem; font-size: 0.875rem; color: #6B7280; line-height: 1.5;">
      <p>
        If you weren't expecting this email, someone else may have entered your email address by accident.
        Questions? Our friendly
        <a href="#" style="color: #2563EB; text-decoration: underline;">support team</a>
        is always happy to help.
      </p>
    </div>
  </div>

</div>

`;
};
