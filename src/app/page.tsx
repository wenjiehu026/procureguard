import { ProcurementDashboard } from "@/components/procurement-dashboard";
import { getTerminal3Status } from "@/lib/t3/status";

export default async function Home() {
  const status = await getTerminal3Status();

  return <ProcurementDashboard initialStatus={status} />;
}
