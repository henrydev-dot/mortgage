import { JsonCollectionEditor } from "@/components/admin/AdminClient";

export default function AdminBurnsPage() {
  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line mx-auto max-w-4xl">
        <JsonCollectionEditor title="Buy & Burn Ledger" endpoint="/api/app/burns" field="burns" />
      </div>
    </div>
  );
}
