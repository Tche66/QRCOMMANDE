export function generateOrderId(): string {
  return crypto.randomUUID();
}

export function formatFcfa(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export function buildSmsUrl(
  phone: string,
  roomNumber: string,
  items: { name: string; qty: number }[],
): string {
  const lines = items.map((i) => `${i.qty}x ${i.name}`).join(', ');
  const body = `Commande chambre ${roomNumber} : ${lines}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const sep = isIOS ? '&' : '?';
  return `sms:${phone}${sep}body=${encodeURIComponent(body)}`;
}

export function buildWhatsAppUrl(
  phone: string,
  roomNumber: string,
  items: { name: string; qty: number }[],
): string {
  const lines = items.map((i) => `${i.qty}x ${i.name}`).join('\n');
  const text = `Commande chambre ${roomNumber} :\n${lines}`;
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}
