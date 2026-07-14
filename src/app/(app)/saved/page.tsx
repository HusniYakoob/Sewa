import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { SaveButton } from "@/components/save-button";
import { formatLKR } from "@/lib/pricing";

const GRADIENTS = [
  ["#834DFB", "#6B2FE0"],
  ["#F0A868", "#E0453C"],
  ["#68C2F0", "#3467C9"],
  ["#7CD98B", "#12A150"],
];

export default async function SavedPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data } = profile
    ? await supabase
        .from("saved_services")
        .select(
          "service_id, service:services(id, title, price, rating, seller:seller_profiles(profile:profiles(full_name)))",
        )
        .eq("buyer_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const saved = (data ?? []) as unknown as {
    service_id: string;
    service: {
      id: string;
      title: string;
      price: number;
      rating: number;
      seller: { profile: { full_name: string } | null } | null;
    } | null;
  }[];

  return (
    <div>
      <div className="flex items-center gap-3.5 px-[22px] pt-3">
        <Link
          href="/account"
          aria-label="Back"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
        >
          <Icon name="arrow_back" />
        </Link>
        <p className="text-[17px] font-extrabold">Saved &amp; Favorites</p>
      </div>

      <div className="px-[22px] pb-24 pt-4">
        {saved.length === 0 ? (
          <EmptyState
            icon="favorite_border"
            title="Nothing saved yet"
            description="Tap the heart on any service to save it here."
          />
        ) : (
          <>
            {saved.map(({ service_id, service }, i) => {
              if (!service) return null;
              const [g1, g2] = GRADIENTS[i % GRADIENTS.length];
              return (
                <Link
                  key={service_id}
                  href={`/service/${service.id}`}
                  className="mb-2.5 flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_4px_14px_-8px_rgba(131,77,251,.15)]"
                >
                  <span
                    className="h-[60px] w-[60px] flex-none rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-extrabold">{service.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11.5px] text-muted-foreground">
                      {service.seller?.profile?.full_name ?? "Sewa pro"} ·{" "}
                      <Icon name="star" filled className="text-[13px] text-[#EAB308]" />
                      {(service.rating ?? 0).toFixed(1)}
                    </p>
                    <p className="mt-0.5 text-[13px] font-extrabold text-brand-text">
                      From {formatLKR(service.price)}
                    </p>
                  </div>
                  <SaveButton serviceId={service.id} initialSaved variant="solid" />
                </Link>
              );
            })}
            <p className="mt-1.5 px-1 text-center text-[11.5px] leading-relaxed text-muted-foreground">
              Tap the heart on any service to save or remove it here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
