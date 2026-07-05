import Link from "next/link";
import { getCurrentProfile, getCurrentSellerProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { AppHeader } from "@/components/nav/app-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AvatarUpload } from "@/components/avatar-upload";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  const seller = profile?.role === "seller" ? await getCurrentSellerProfile() : null;

  return (
    <div>
      <AppHeader
        title="Profile"
        action={{ href: "/settings", icon: "settings", label: "Settings" }}
      />
      <div className="flex flex-col gap-4 p-4">
        <Card className="flex items-center gap-3">
          {profile ? (
            <AvatarUpload name={profile.full_name} avatarUrl={profile.avatar_url} />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-semibold">{profile?.full_name || "Your name"}</p>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <Badge variant="neutral" className="ml-auto capitalize">
            {profile?.role}
          </Badge>
        </Card>

        {seller ? (
          <>
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Seller profile</p>
                <p className="text-sm text-muted-foreground">
                  Bio, description and service areas buyers see.
                </p>
              </div>
              <Link href="/seller-profile">
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            </Card>

            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">NIC verification</p>
                <p className="text-sm text-muted-foreground">
                  Required before payouts.
                </p>
              </div>
              {seller.nic_verified ? (
                <Badge variant="success">
                  <Icon name="verified" filled /> Verified
                </Badge>
              ) : (
                <Link href="/verify-nic">
                  <Button variant="secondary" size="sm">
                    Verify
                  </Button>
                </Link>
              )}
            </Card>
          </>
        ) : null}

        <form action={signOut}>
          <Button type="submit" variant="secondary" block>
            <Icon name="logout" /> Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
