import { ReportForm } from "./report-form";

export default async function ReportProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking } = await searchParams;
  return <ReportForm bookingId={booking ?? null} />;
}
