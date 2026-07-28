import { Nav } from "@/components/Nav";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav signOutAction={signOutAction} />
      <div className="flex-1 overflow-y-auto px-6 py-8">{children}</div>
    </div>
  );
}
