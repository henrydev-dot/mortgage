import { JsonCollectionEditor } from "@/components/admin/AdminClient";

export default function AdminPropertiesPage() {
  return (
    <div className="min-h-screen bg-fog py-16">
      <div className="container-line mx-auto max-w-4xl">
        <JsonCollectionEditor
          title="Properties"
          endpoint="/api/app/properties"
          field="properties"
        />
      </div>
    </div>
  );
}
