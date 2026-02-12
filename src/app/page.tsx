import { redirect } from "next/navigation";

/*
  Root route handler.

  Redirects base path to the default locale entrypoint.
*/

export default function HomePage() {
  redirect("/en");
}

