import PolicyPage, { policyMetadata } from "@/components/PolicyView";

export async function generateMetadata() {
  return policyMetadata("terms");
}

export default function Page() {
  return <PolicyPage slug="terms" />;
}
