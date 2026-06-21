import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/notify';
import { sendZalo } from '@/lib/notify';
import { logger } from '@/lib/logger';

export async function runMarketingCampaign() {
  const supabase = await createClient();
  
  try {
    // 1. Find customers who haven't booked in > 30 days
    const { data: dormantCustomers, error: dormantErr } = await supabase
      .from('customers')
      .select('id, full_name, phone, email, last_booking_date')
      .lt('last_booking_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (dormantErr) throw dormantErr;

    for (const customer of dormantCustomers || []) {
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: 'Min Nail & Hair nhớ bạn! ✨',
          html: `<p>Chào <b>${customer.full_name}</b>, đã lâu rồi chúng tôi không gặp bạn. Tặng bạn mã giảm giá 10% cho lần hẹn tới!</p>`
        }).catch(e => logger.error(`Marketing Email failed for ${customer.id}`, e));
      }
      if (customer.phone) {
        await sendZalo({
          phone: customer.phone,
          message: `Chào ${customer.full_name}, Min Nail & Hair nhớ bạn! ✨ Tặng bạn mã giảm giá 10% cho lần hẹn tới nhé.`
        }).catch(e => logger.error(`Marketing Zalo failed for ${customer.id}`, e));
      }
    }

    // 2. Find customers having birthday today
    const today = new Date().toISOString().split('T')[0];
    const { data: birthdayCustomers, error: bdayErr } = await supabase
      .from('customers')
      .select('id, full_name, phone, email')
      .eq('birthday', today);

    if (bdayErr) throw bdayErr;

    for (const customer of birthdayCustomers || []) {
      if (customer.email) {
        await sendEmail({
          to: customer.email,
          subject: 'Chúc mừng sinh nhật từ Min Nail & Hair! 🎂',
          html: `<p>Chúc mừng sinh nhật <b>${customer.full_name}</b>! Min Nail & Hair gửi tặng bạn một buổi gội dưỡng sinh miễn phí trong tháng sinh nhật này.</p>`
        }).catch(e => logger.error(`Bday Email failed for ${customer.id}`, e));
      }
      if (customer.phone) {
        await sendZalo({
          phone: customer.phone,
          message: `Chúc mừng sinh nhật ${customer.full_name}! 🎂 Min Nail & Hair tặng bạn một buổi gội dưỡng sinh miễn phí. Liên hệ đặt lịch ngay nhé!`
        }).catch(e => logger.error(`Bday Zalo failed for ${customer.id}`, e));
      }
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Marketing campaign failed', err);
    return { success: false, error: err.message };
  }
}
