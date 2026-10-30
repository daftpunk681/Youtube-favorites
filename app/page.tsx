import { Library } from "@/components/library";
import { getLibrary } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [data, admin] = await Promise.all([getLibrary(), isAdmin()]);
  return <Library initialData={data} admin={admin} />;
}
