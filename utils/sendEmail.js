const axios = require('axios');

exports.sendOrderReceiptEmail = async (order) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_resend')) {
    console.log('Skipping email receipt: RESEND_API_KEY not configured');
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${item.name} (x${item.quantity})</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
          ₦${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>`
    )
    .join('');

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #4f46e5; margin-bottom: 4px;">VortexMart Order Confirmed</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 0;">Reference: <strong>${order.orderReference}</strong></p>
      <p style="color: #334155; font-size: 14px;">Hi <strong>${order.customer.fullName}</strong>, we have received your payment and your order is now being prepared for dispatch to <strong>${order.customer.address}, ${order.customer.city}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        ${itemsHtml}
        <tr>
          <td style="padding-top: 12px; font-weight: bold;">Total Paid (incl. Delivery)</td>
          <td style="padding-top: 12px; text-align: right; font-weight: bold; color: #059669; font-size: 16px;">
            ₦${Number(order.totalAmount).toLocaleString()}
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #94a3b8;">Track your live delivery status anytime inside your VortexMart Orders portal.</p>
    </div>
  `;

  try {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: process.env.EMAIL_FROM || 'VortexMart <onboarding@resend.dev>',
        to: [order.customer.email],
        subject: `Order Confirmed — ${order.orderReference}`,
        html: htmlContent
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Resend Email Error:', error.response?.data || error.message);
  }
};