import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Nav email={session.user.email ?? ""} />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
