import type { Metadata } from "next";
import "./admin.css";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "블로그 관리",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
