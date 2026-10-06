import PolicyPage, { policyMetadata } from "@/components/PolicyView";

export async function generateMetadata() {
  return policyMetadata("delivery");
}

export default function Page() {
  return <PolicyPage slug="delivery" />;
}
