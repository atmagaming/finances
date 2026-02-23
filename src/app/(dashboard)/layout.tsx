import { auth } from "@/auth";
import { Nav } from "@/components/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <>
      <Nav userName={session?.user?.name ?? undefined} userImage={session?.user?.image ?? null} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
