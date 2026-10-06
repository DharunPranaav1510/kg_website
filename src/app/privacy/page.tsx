import PolicyPage, { policyMetadata } from "@/components/PolicyView";

export async function generateMetadata() {
  return policyMetadata("privacy");
}

export default function Page() {
  return <PolicyPage slug="privacy" />;
}
