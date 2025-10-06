import QRCode from 'qrcode';

export function buildUpiUri({ pa, pn, am, orderId }) {
  const tn = `QUIZ-${orderId}`;
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
}

export async function generateQrDataUrl(upiUri) {
  return QRCode.toDataURL(upiUri);
}
