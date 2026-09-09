import PublicNav from "@/components/PublicNav";
import PaymentClient from "@/components/PaymentClient";

export default function PagamentoPage({ params }: { params: { orderId: string } }) {
  return (
    <>
      <PublicNav />
      <PaymentClient orderId={params.orderId} />
    </>
  );
}
