import { getCurrentProfile } from "@/lib/auth";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <EditProfileForm
      fullName={profile?.full_name ?? ""}
      phone={profile?.phone ?? ""}
      email={profile?.email ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
