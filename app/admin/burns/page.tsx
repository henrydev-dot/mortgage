import { JsonCollectionEditor } from "@/components/admin/AdminClient";

export default function AdminBurnsPage() {
  return (
    <JsonCollectionEditor title="Buy & Burn Ledger" endpoint="/api/app/burns" field="burns" />
  );
}
