import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { NewServiceForm } from "./new-service-form";

export default async function NewServicePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div>
      <AppHeader title="Add service" backHref="/services" />
      <NewServiceForm categories={categories ?? []} />
    </div>
  );
}
