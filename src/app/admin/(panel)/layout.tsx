import { requireAdmin } from "@/src/lib/admin/auth";
import { panelBadges } from "@/src/lib/admin/queries";
import { cookies } from "next/headers";
import AdminShell from "@/src/components/admin/AdminShell";
import { THEME_COOKIE, readTheme } from "@/src/lib/admin/theme";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const badges = await panelBadges();
  const theme = readTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <AdminShell user={session.u} badges={badges} theme={theme}>
      {children}
    </AdminShell>
  );
}
