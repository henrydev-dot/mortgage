import { notFound } from "next/navigation";
import PropertyDetail from "@/components/dapp/PropertyDetail";
import { seedProperties, type AppProperty } from "@/lib/appSeed";
import { readCollection } from "@/lib/appStore";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const properties = await readCollection<AppProperty>("properties", seedProperties);
  const property = properties.find(
    (p) => p.id.toLowerCase() === decodeURIComponent(params.id).toLowerCase()
  );
  if (!property) notFound();
  return <PropertyDetail property={property} />;
}
