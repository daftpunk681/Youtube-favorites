import { Library } from "@/components/library";
import { Login } from "@/components/login";
import { getLibrary } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { adminConfigured } from "@/lib/config";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration — YouTube Favorites",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  if (!(await isAdmin())) return <Login configured={adminConfigured()} />;
  return <Library initialData={await getLibrary()} admin administration />;
}
