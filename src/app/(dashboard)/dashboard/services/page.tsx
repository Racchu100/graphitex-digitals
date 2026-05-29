import { redirect } from "next/navigation";

export default function ServicesPageRedirect() {
  redirect("/dashboard/profile?tab=services");
}
