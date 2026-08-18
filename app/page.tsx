import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  redirect(session ? "/dashboard" : "/login");
}
