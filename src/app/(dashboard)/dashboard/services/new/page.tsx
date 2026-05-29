import { redirect } from "next/navigation";

export default function NewServicePageRedirect() {
  redirect("/dashboard/profile?tab=services");
}
