import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="legal notfound">
      <div className="err-code">404</div>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>요청하신 페이지가 이동되었거나 존재하지 않습니다.</p>
      <Link className="btn btn-blue" href="/"><i className="fa-solid fa-house"></i> 홈으로 돌아가기</Link>
    </main>
  );
}
