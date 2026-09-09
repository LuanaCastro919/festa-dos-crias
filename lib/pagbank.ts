import crypto from "crypto";

const BASE_URL =
  process.env.PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

type CreatePixChargeInput = {
  referenceId: string; // usamos o id do pedido (orders.id)
  description: string;
  amountCents: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhoneDDD: string;
  buyerPhoneNumber: string;
  expirationMinutes?: number;
};

export type PixChargeResult = {
  pagbankOrderId: string;
  chargeId: string;
  status: string;
  qrText: string;
  qrImageUrl: string;
  expiration: string;
};

/**
 * Cria um "pedido" no PagBank com uma cobrança PIX (QR Code dinâmico).
 * Documentação: https://developer.pagbank.com.br/reference/criar-pedido-com-qr-code-pix-v2
 */
export async function createPixCharge(
  input: CreatePixChargeInput
): Promise<PixChargeResult> {
  const token = process.env.PAGBANK_TOKEN;
  if (!token) throw new Error("PAGBANK_TOKEN não configurado.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");

  const expirationMinutes = input.expirationMinutes ?? 30;
  const expirationDate = new Date(
    Date.now() + expirationMinutes * 60 * 1000
  ).toISOString();

  const body = {
    reference_id: input.referenceId,
    customer: {
      name: input.buyerName,
      email: input.buyerEmail,
      tax_id: input.buyerCpf.replace(/\D/g, ""),
      phones: [
        {
          country: "55",
          area: input.buyerPhoneDDD,
          number: input.buyerPhoneNumber,
          type: "MOBILE",
        },
      ],
    },
    items: [
      {
        reference_id: input.referenceId,
        name: input.description,
        quantity: 1,
        unit_amount: input.amountCents,
      },
    ],
    charges: [
      {
        reference_id: input.referenceId,
        description: input.description,
        amount: { value: input.amountCents, currency: "BRL" },
        payment_method: {
          type: "PIX",
          pix: { expiration_date: expirationDate },
        },
      },
    ],
    notification_urls: [`${siteUrl}/api/webhooks/pagbank`],
  };

  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg =
      data?.error_messages?.map((e: any) => e.description).join("; ") ||
      "Falha ao criar cobrança PIX no PagBank.";
    throw new Error(msg);
  }

  const charge = data.charges?.[0];
  if (!charge || charge.status === "DECLINED") {
    throw new Error("Cobrança PIX recusada pelo PagBank.");
  }

  const qrPngLink = charge.links?.find((l: any) => l.rel === "QRCODE.PNG");

  return {
    pagbankOrderId: data.id,
    chargeId: charge.id,
    status: charge.status,
    qrText: charge.qr_code?.text ?? "",
    qrImageUrl: qrPngLink?.href ?? "",
    expiration: expirationDate,
  };
}

/**
 * Confere se uma notificação recebida no webhook realmente veio do PagBank.
 * Documentação: https://developer.pagbank.com.br/reference/confirmar-autenticidade-da-notificacao
 * Assinatura = SHA256("{token}-{payload_bruto_sem_formatacao}")
 */
export function verifyPagbankSignature(
  rawBody: string,
  receivedSignature: string | null
): boolean {
  const token = process.env.PAGBANK_TOKEN;
  if (!token || !receivedSignature) return false;

  const expected = crypto
    .createHash("sha256")
    .update(`${token}-${rawBody}`)
    .digest("hex");

  // comparação em tempo constante para evitar timing attacks
  const a = Buffer.from(expected);
  const b = Buffer.from(receivedSignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
