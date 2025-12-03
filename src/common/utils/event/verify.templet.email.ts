export const verifyEmail = ({ otp, title } : { otp: string, title: string }): string => {

    return `<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
    <tr>
    <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <tr>
            <td style="background-color: #4CAF50; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Our App</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
            <h2 style="color: #333;">${title}</h2>
            <p style="color: #555; font-size: 16px;">Thank you for signing up! Please use the OTP code below to confirm your email address.</p>
            <div style="margin: 30px 0; text-align: center;">
                <span style="display: inline-block; background-color: #eee; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #333; border-radius: 8px;">
                ${otp}
                </span>
            </div>
            <p style="color: #888; font-size: 14px;">This code will expire in 2 minutes. If you didn’t request this, please ignore this email.</p>
            <p style="color: #888; font-size: 14px;">Best regards,<br> The Team</p>
            </td>
            </tr>
            <tr>
            <td style="background-color: #f4f4f4; text-align: center; padding: 20px; font-size: 12px; color: #999;">
            © 2025 Our App. All rights reserved.  
            </td>
        </tr>
            </table>
        </td>
        </tr>
    </table>
</body>`
}