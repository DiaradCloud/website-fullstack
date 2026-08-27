import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "./admin.login";

export const Route = createFileRoute("/admin/panel")({
  head: () => ({ meta: [{ title: "ورود مدیریت — دیاراد کلود" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});
