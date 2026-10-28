import { redirect } from "next/navigation";
import ReportsCatalog from "@/modulos/Reports/ReportsCatalog";

type Query = Record<string, string | string[] | undefined>;

export default async function ReportsRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  // Preserve links already shared by the existing report actions.
  if (typeof query.preset === "string" && query.preset) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") params.set(key, value);
    }
    redirect(`/reports/view?${params}`);
  }
  return <ReportsCatalog />;
}
