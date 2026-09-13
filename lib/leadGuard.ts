// 리드 폼 서버 전용 방어 — 일회용(임시) 메일 차단 + 메일 수신 가능 도메인인지 DNS 확인.
//
// ⚠️ **서버(route handler)에서만 import 한다.** disposable-domains.json이 140KB라
// 클라이언트 컴포넌트에서 부르면 그대로 번들에 실린다. 폼의 즉시 피드백용 검사는
// lib/leadForm.ts(가벼운 개인메일 리스트)가 담당하고, 여기가 최종 방어선이다.
//
// 배경(2026-09-13): sikan40347@airhemp.com — 손으로 관리하던 30개 리스트엔 없지만
// 공개 블록리스트엔 등재된 임시메일이었다. 연락처는 01000000000. 소개서만 받아가고
// 연락은 닿지 않는 리드라 영업 리스트를 오염시킨다.

import { promises as dns } from "node:dns";
import DISPOSABLE from "./disposable-domains.json";

const DISPOSABLE_DOMAINS = new Set(DISPOSABLE as string[]);

function domainOf(email: string): string {
  return email.trim().toLowerCase().split("@")[1] || "";
}

/**
 * 일회용(임시) 메일 도메인인지. 임시메일 서비스는 서브도메인을 흩뿌리므로
 * (`x.mailinator.com`) 상위 도메인까지 거슬러 올라가며 대조한다.
 */
export function isDisposableEmail(email: string): boolean {
  const parts = domainOf(email).split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

/**
 * 메일을 실제로 받을 수 있는 도메인인지(MX 또는 A 레코드 존재).
 * 오타 도메인·존재하지 않는 도메인을 걸러 "보냈는데 반송되는" 리드를 막는다.
 *
 * 조회가 느리거나 실패하면 **통과**시킨다 — DNS 문제로 진짜 리드를 잃는 쪽이 더 비싸다.
 */
export async function hasMailExchanger(email: string, timeoutMs = 2500): Promise<boolean> {
  const domain = domainOf(email);
  if (!domain) return false;

  const lookup = (async () => {
    try {
      const mx = await dns.resolveMx(domain);
      if (mx.length > 0) return true;
    } catch {
      // NXDOMAIN·NODATA 모두 여기로 온다 — A 레코드로 한 번 더 확인(MX 없는 도메인은 A가 폴백)
    }
    try {
      return (await dns.resolve4(domain)).length > 0;
    } catch {
      return false;
    }
  })();

  const timeout = new Promise<boolean>((r) => setTimeout(() => r(true), timeoutMs));
  return Promise.race([lookup, timeout]);
}

export const LEAD_GUARD_MSG = {
  disposable: "임시·일회용 메일 주소로는 신청할 수 없습니다. 회사 이메일을 입력해 주세요.",
  undeliverable: "메일을 받을 수 없는 도메인입니다. 이메일 주소를 다시 확인해 주세요.",
  phone: "연락 가능한 번호를 입력해 주세요. (예: 010-1234-5678)",
} as const;
