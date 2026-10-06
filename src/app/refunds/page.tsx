import PolicyPage, { policyMetadata } from "@/components/PolicyView";

export async function generateMetadata() {
  return policyMetadata("refunds");
}

export default function Page() {
  return <PolicyPage slug="refunds" />;
}
