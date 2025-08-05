export const resetPassword = (Link) => {
  return `
    <div style="max-width: 28rem; margin: 0 auto; background-color: white; padding: 2rem; font-family: sans-serif;">
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 1.875rem; font-weight: bold; color: black;">skayShare</h1>
        </div>

        <div style="text-align: center;">
            <h2 style="font-size: 1.5rem; font-weight: normal; color: black; line-height: 1.25;">
                Need a little (password) change?
            </h2>

            <p style="color: #4B5563; font-size: 1rem; line-height: 1.6;">
                Need a new password? We've all been there. Just
                <a href="${Link}" target="_blank" style="color: #2563EB; text-decoration: underline;">
                    click this link
                </a>
                or hit the button below and we'll get this sorted for you.
            </p>

            <div style="padding-top: 1rem;">
                <a href="${Link}" target="_blank" style="text-decoration: none;">
                    <button style="
         
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
          font-size: 1rem;
          transition: all 0.3s ease;
          padding: 0.5rem 1rem;
          width: 100%;
          height: 3rem;
          background-color: #60A5FA;
          color: white;
          font-weight: 500;
          border-radius: 1rem;
          cursor: pointer;
          border: none;
        " onmouseover="this.style.backgroundColor='#3B82F6';" onmouseout="this.style.backgroundColor='#60A5FA';">
                        Set new password
                    </button>
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
    </div>`;
};
