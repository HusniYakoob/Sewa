/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { approveNic, rejectNic } from "../actions";

export default async function AdminNicPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("nic_verifications")
    .select("user_id, nic_masked, full_name, date_of_birth, document_url, selfie_url, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as {
    user_id: string;
    nic_masked: string | null;
    full_name: string | null;
    date_of_birth: string | null;
    document_url: string | null;
    selfie_url: string | null;
  }[];

  async function signed(path: string | null): Promise<string | null> {
    if (!path) return null;
    const { data } = await supabase.storage
      .from("nic-documents")
      .createSignedUrl(path, 600);
    return data?.signedUrl ?? null;
  }

  const items = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      docUrl: await signed(r.document_url),
      selfieUrl: await signed(r.selfie_url),
    })),
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">NIC verification</h1>
      {items.length === 0 ? (
        <EmptyState icon="badge" title="No submissions to review" />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((r) => (
            <li key={r.user_id}>
              <Card>
                <p className="font-semibold">{r.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  NIC {r.nic_masked}
                  {r.date_of_birth ? ` · DOB ${r.date_of_birth}` : ""}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {r.docUrl ? (
                    <a href={r.docUrl} target="_blank" rel="noreferrer">
                      <img
                        src={r.docUrl}
                        alt="NIC document"
                        className="h-32 w-full rounded-lg border border-border object-cover"
                      />
                    </a>
                  ) : null}
                  {r.selfieUrl ? (
                    <a href={r.selfieUrl} target="_blank" rel="noreferrer">
                      <img
                        src={r.selfieUrl}
                        alt="Selfie"
                        className="h-32 w-full rounded-lg border border-border object-cover"
                      />
                    </a>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                  <form action={approveNic}>
                    <input type="hidden" name="user_id" value={r.user_id} />
                    <Button size="sm" type="submit">
                      <Icon name="verified" filled /> Approve
                    </Button>
                  </form>
                  <form action={rejectNic} className="flex gap-2">
                    <input type="hidden" name="user_id" value={r.user_id} />
                    <Input name="reason" placeholder="Reason (optional)" className="h-9" />
                    <Button size="sm" variant="destructive" type="submit">
                      Reject
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
