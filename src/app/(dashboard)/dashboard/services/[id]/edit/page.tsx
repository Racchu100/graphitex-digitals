import { redirect } from "next/navigation";

export default function EditServicePageRedirect() {
  redirect("/dashboard/profile?tab=services");
}
