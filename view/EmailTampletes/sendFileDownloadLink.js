export const sendFileDownloadLink = ({
  emailFrom,
  title,
  items,
  totalSize,
  expires,
  link,
}) => {
  return `
      <div style="max-width: 28rem; margin: 0 auto; background-color: white; padding: 2rem; font-family: sans-serif;">
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 1.875rem; font-weight: bold; color: black;">skayShare</h1>
        </div>

        <div style="text-align: center;">
            <h2 style="font-size: 1.5rem; font-weight: normal; color: #2563EB; line-height: 1.25;">
                ${emailFrom}
            </h2>

            <h2 style="font-size: 1.5rem; font-weight: normal; color: black; margin: 0px; margin-top: -10px;">
                sent you ${title}
            </h2>

            <p style="color: #4B5563; font-size: 1rem; line-height: 1.6;">
                ${items} item, ${totalSize} in total・ Expires on ${expires}
            </p>

            <div style="padding-top: 1rem;">
                <a href="${link}" target="_blank"
                    style="background-color: #5268ff; color: #ffffff; display: block; font-size: 14px; font-style: normal; text-align: center; text-decoration: none; word-spacing: 0; border-radius: 25px; padding: 15px 20px; outline: none; max-width: 280px; margin: auto;">
                    Get your files
                </a>
            </div>

            <div style="padding-top: 2rem; font-size: 0.875rem; color: #6B7280; line-height: 1.6;">
                <p>
                    If you weren't expecting this email, someone else may have entered
                    your email address by accident. Questions? Our friendly
                    <a href="#" style="color: #2563EB; text-decoration: underline;">
                        support team
                    </a>
                    is always happy to help.
                </p>
            </div>
        </div>
    </div>
  
  `;
};
