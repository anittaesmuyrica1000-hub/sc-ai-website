// 일회용(임시) 메일 도메인 블록리스트 동기화 — `node scripts/sync-disposable-domains.mjs`
//
// 출처: https://github.com/disposable-email-domains/disposable-email-domains (CC0, 커뮤니티 유지보수)
// 손으로 관리하던 30개 리스트로는 airhemp.com 같은 신종 임시메일을 못 잡아서 도입했다(2026-09-13).
// 결과물 lib/disposable-domains.json 은 **서버 전용**(lib/leadGuard.ts)에서만 import 한다 — 125KB라
// 클라이언트 번들에 들어가면 안 된다. 리스트는 계속 늘어나므로 분기에 한 번 정도 이 스크립트를 돌린다.
import { writeFileSync } from "node:fs";

const SRC = "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf";
const OUT = new URL("../lib/disposable-domains.json", import.meta.url);

const res = await fetch(SRC);
if (!res.ok) {
  console.error(`가져오기 실패: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const domains = [...new Set(
  (await res.text())
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("#"))
)].sort();

if (domains.length < 5000) {
  console.error(`받은 도메인이 ${domains.length}개뿐 — 원본이 깨졌을 수 있어 중단합니다.`);
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(domains) + "\n");
console.log(`lib/disposable-domains.json — ${domains.length}개 도메인 저장 완료`);
