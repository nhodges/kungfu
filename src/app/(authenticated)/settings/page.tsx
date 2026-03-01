import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { XConnectionCard } from "@/components/x-connection-card";
import { ApiKeys } from "@/components/api-keys";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const xConnection = await prisma.sourceConnection.findUnique({
    where: { userId_source: { userId, source: "x" } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Email: <span className="text-white">{session?.user?.email}</span>
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Connected Sources</h2>
        <XConnectionCard
          connected={!!xConnection}
          username={xConnection?.sourceUsername ?? null}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">API Keys</h2>
        <p className="text-sm text-gray-400 mb-3">
          Use API keys to access your bookmarks programmatically or from AI agents.
        </p>
        <ApiKeys />
      </section>
    </div>
  );
}
