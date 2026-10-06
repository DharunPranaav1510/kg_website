import PolicyPage, { policyMetadata } from "@/components/PolicyView";

export async function generateMetadata() {
  return policyMetadata("cancellation");
}

export default function Page() {
  return <PolicyPage slug="cancellation" />;
}
