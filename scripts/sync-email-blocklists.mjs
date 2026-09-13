// 이메일 도메인 블록리스트 동기화 — `node scripts/sync-email-blocklists.mjs`
//
// 두 개를 받아 lib/ 에 저장한다. 둘 다 **서버 전용**(lib/leadGuard.ts)에서만 import 한다 —
// 합쳐서 200KB 가까이라 클라이언트 번들에 들어가면 안 된다.
//
//   disposable-domains.json  일회용(임시) 메일          출처: disposable-email-domains (CC0)
//   free-email-domains.json  개인용 무료 메일 제공자     출처: willwhite/freemail (MIT)
//
// ⚠️ 공개 목록은 글로벌 위주라 **국내 제공자가 빠져 있다**(daum.net·kakao.com·nate.com 등
// 2026-09-13 확인). 국내분은 lib/leadForm.ts 의 PERSONAL_EMAIL_DOMAINS 가 직접 관리하고,
// 이 목록은 그걸 보완하는 용도다. 둘 중 하나만 믿으면 구멍이 난다.
import { writeFileSync } from "node:fs";

const SOURCES = [
  {
    name: "disposable-domains.json",
    url: "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf",
    min: 5000,
  },
  {
    name: "free-email-domains.json",
    url: "https://raw.githubusercontent.com/willwhite/freemail/master/data/free.txt",
    min: 3000,
  },
];

for (const { name, url, min } of SOURCES) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`${name}: 가져오기 실패 ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const domains = [...new Set(
    (await res.text())
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith("#"))
  )].sort();

  // 원본이 깨졌을 때 목록을 비워버리지 않도록 하한을 둔다
  if (domains.length < min) {
    console.error(`${name}: ${domains.length}개뿐 (기대 ${min}+) — 원본이 깨진 듯해 중단합니다.`);
    process.exit(1);
  }

  writeFileSync(new URL(`../lib/${name}`, import.meta.url), JSON.stringify(domains) + "\n");
  console.log(`lib/${name} — ${domains.length}개 저장`);
}
