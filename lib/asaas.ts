const BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

function authHeaders() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurado.");
  return {
    "Content-Type": "application/json",
    "User-Agent": "baile-dos-crias",
    access_token: key,
  };
}

type CreatePixChargeInput = {
  referenceId: string; // usamos o id do pedido (orders.id)
  description: string;
  amountCents: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
  buyerPhone: string; // só dígitos, com DDD
};

export type PixChargeResult = {
  asaasCustomerId: string;
  asaasPaymentId: string;
  status: string;
  qrText: string;
  qrImageUrl: string;
  expiration: string;
};

async function findOrCreateCustomer(input: CreatePixChargeInput): Promise<string> {
  const cpf = input.buyerCpf.replace(/\D/g, "");

  // tenta achar um cliente já cadastrado com esse CPF pra não duplicar
  const searchRes = await fetch(`${BASE_URL}/customers?cpfCnpj=${cpf}`, {
    headers: authHeaders(),
  });
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.[0]?.id) {
      return searchData.data[0].id;
    }
  }

  const createRes = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name: input.buyerName,
      email: input.buyerEmail,
      cpfCnpj: cpf,
      mobilePhone: input.buyerPhone.replace(/\D/g, ""),
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    const msg =
      createData?.errors?.map((e: any) => e.description).join("; ") ||
      "Falha ao cadastrar comprador no Asaas.";
    throw new Error(msg);
  }
  return createData.id;
}

/**
 * Cria uma cobrança PIX real no Asaas e retorna o QR Code (imagem + copia-e-cola).
 * Documentação: https://docs.asaas.com/docs/cobrancas-via-pix
 */
export async function createPixCharge(
  input: CreatePixChargeInput
): Promise<PixChargeResult> {
  const customerId = await findOrCreateCustomer(input);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const paymentRes = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: input.amountCents / 100,
      dueDate: today,
      description: input.description,
      externalReference: input.referenceId,
    }),
  });
  const paymentData = await paymentRes.json();
  if (!paymentRes.ok || !paymentData.id) {
    const msg =
      paymentData?.errors?.map((e: any) => e.description).join("; ") ||
      "Falha ao criar cobrança PIX no Asaas.";
    throw new Error(msg);
  }

  const qrRes = await fetch(`${BASE_URL}/payments/${paymentData.id}/pixQrCode`, {
    headers: authHeaders(),
  });
  const qrData = await qrRes.json();
  if (!qrRes.ok || !qrData.payload) {
    throw new Error("Falha ao gerar o QR Code do PIX no Asaas.");
  }

  return {
    asaasCustomerId: customerId,
    asaasPaymentId: paymentData.id,
    status: paymentData.status,
    qrText: qrData.payload,
    qrImageUrl: `data:image/png;base64,${qrData.encodedImage}`,
    expiration: qrData.expirationDate ?? `${today}T23:59:59`,
  };
}

/**
 * Consulta diretamente na API do Asaas o status atual de uma cobrança.
 * Serve como plano B para quando o webhook demora ou falha em chegar.
 */
export async function getPaymentStatus(
  asaasPaymentId: string
): Promise<{ status: string; paidAt?: string } | null> {
  const res = await fetch(`${BASE_URL}/payments/${asaasPaymentId}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { status: data.status, paidAt: data.paymentDate ?? data.clientPaymentDate };
}

/**
 * Confere se a notificação recebida no webhook realmente veio do Asaas,
 * comparando com o token que você configurou no painel deles.
 */
export function verifyAsaasWebhookToken(receivedToken: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return true; // token não configurado ainda — não bloqueia
  return receivedToken === expected;
}
