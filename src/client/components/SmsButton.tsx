import { h } from 'preact';
import { buildSmsUrl, buildWhatsAppUrl } from '../order-helpers';

interface Props {
  phone: string;
  roomNumber: string;
  items: { name: string; qty: number }[];
}

export function SmsButton({ phone, roomNumber, items }: Props) {
  if (!phone) return null;

  return (
    <div class="sms-fallback">
      <p class="sms-fallback-text">Vous pouvez aussi commander par :</p>
      <div class="sms-fallback-buttons">
        <a href={buildSmsUrl(phone, roomNumber, items)} class="btn btn-sms">
          SMS
        </a>
        <a href={buildWhatsAppUrl(phone, roomNumber, items)} class="btn btn-whatsapp" target="_blank" rel="noopener">
          WhatsApp
        </a>
      </div>
    </div>
  );
}
