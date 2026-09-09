import crypto from "crypto";
import QRCode from "qrcode";

/**
 * Gera um código de ingresso único, ex: BDC-7F3K9QZP
 * Usado como o "conteúdo" do QR code e como chave de busca no check-in.
 */
export function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I pra evitar confusão
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `BDC-${code}`;
}

/**
 * Gera a imagem do QR code (data URL base64 PNG) para um código de ingresso.
 * O QR contém só o código (ex: BDC-7F3K9QZP) — é isso que o leitor da
 * portaria recebe ao escanear, e envia direto pra rota de validação.
 */
export async function generateTicketQrDataUrl(
  ticketCode: string
): Promise<string> {
  return QRCode.toDataURL(ticketCode, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}
