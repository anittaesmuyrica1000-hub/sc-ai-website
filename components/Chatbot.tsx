"use client";

import { useEffect, useRef, useState } from "react";

// 채팅 도우미(챗봇) — FAQ 기반 응답 + 도입 문의 연결. 백엔드 없이 동작. 스타일은 theme.css(.cbot*).
type KbItem = { q: string; a: string; k: string[]; quick?: boolean; icon?: string };
const KB: KbItem[] = [
  { q: "AI 면접은 어떻게 진행되나요?", a: "지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AI 면접이 응답을 분석·검증해 역량 평가와 핵심 요약이 담긴 리포트를 만들고, 채용팀에는 검증을 통과한 상위 후보의 리포트만 전달됩니다.", k: ["면접", "진행", "어떻게", "응시", "방식", "절차"], quick: true, icon: "fa-circle-play" },
  { q: "리포트에는 어떤 내용이 담기나요?", a: "인터뷰 핵심 요약, 종합 등급, 역량 차트(의사소통·문제해결·직무 지식·협업·태도·성실성), 강점·약점 분석이 담깁니다. 긴 영상을 다시 보지 않아도 지원자가 어떤 사람인지 한눈에 파악할 수 있어요.", k: ["리포트", "결과", "보고서", "차트", "등급", "역량", "요약", "강점", "약점", "내용"], quick: true, icon: "fa-file-lines" },
  { q: "AI 면접이 사람 면접을 완전히 대체하나요?", a: "1차 검토와 지원자 선별을 자동화해 채용팀의 시간을 아껴줍니다. 검증을 통과한 핵심 인재 리포트만 전달되며, 최종 판단은 채용팀이 직접 내립니다.", k: ["대체", "사람", "최종", "판단", "선별", "1차"], quick: true, icon: "fa-user-check" },
  { q: "어떤 직무·산업에 쓸 수 있나요?", a: "직무에 관계없이 활용할 수 있으며, 특히 개발자 등 역량 검증이 중요한 채용에서 강점을 발휘합니다. 자세한 적용 방안은 도입 상담에서 안내해 드려요.", k: ["직무", "산업", "분야", "개발자", "직군", "업종"] },
  { q: "지원자는 따로 준비할 게 있나요?", a: "별도 설치 없이 안내된 링크로 온라인에서 편하게 응시하면 됩니다. 지원자 경험을 해치지 않도록 설계돼 있어요.", k: ["지원자", "준비", "설치", "응시자", "경험", "참여"] },
  { q: "동시에 많은 지원자를 처리할 수 있나요?", a: "네, 수천 명의 지원자를 한 번에 1차 검증할 수 있습니다. 지원자가 몰려도 채용팀 부담 없이 빠르게 선별됩니다.", k: ["동시", "대량", "수천", "많은", "처리", "규모"] },
  { q: "평가가 공정한가요?", a: "이력서의 주장과 실제 면접 응답을 대조해 데이터 기반으로 일관되게 검증합니다. 모든 지원자에게 동일한 기준이 적용돼요.", k: ["공정", "편향", "객관", "기준", "신뢰", "정확"] },
  { q: "기존 ATS·채용 툴과 연동되나요?", a: "리포트는 표준 형식으로 제공되어 기존 채용 프로세스에 바로 활용할 수 있습니다. 상세 연동 방식은 도입 상담에서 안내해 드려요.", k: ["ats", "연동", "툴", "통합", "연결", "시스템"], quick: true, icon: "fa-plug" },
  { q: "지원자 데이터는 안전한가요?", a: '모든 데이터는 전송 구간 암호화(HTTPS)와 접근 통제 정책 아래 안전하게 관리됩니다. 수집 항목과 처리 방식은 <a href="/privacy">개인정보처리방침</a>에서 확인하실 수 있어요.', k: ["데이터", "보안", "안전", "개인정보", "보호", "암호화"], quick: true, icon: "fa-shield-halved" },
  { q: "무료로 먼저 써볼 수 있나요?", a: '네, 설치나 계약 없이 무료로 도입 효과를 먼저 확인하실 수 있어요. <a href="/apply">도입 문의</a>를 남기시면 영업일 기준 1일 내 데모와 함께 안내드립니다.', k: ["무료", "체험", "테스트", "시범", "데모", "trial"], quick: true, icon: "fa-gift" },
  { q: "도입까지 얼마나 걸리나요?", a: "설치나 계약 없이 무료 신청 후 바로 시작할 수 있습니다. 신청하시면 영업일 기준 1일 내 담당자가 데모와 함께 안내드려요.", k: ["도입", "기간", "얼마나", "시작", "언제", "소요"] },
  { q: "비용은 어떻게 되나요?", a: "채용 규모와 활용 방식에 맞춰 책정됩니다. 우선 무료로 도입 효과를 확인해 보신 뒤 상담을 통해 안내해 드려요.", k: ["비용", "가격", "요금", "견적", "얼마"], quick: true, icon: "fa-won-sign" },
  { q: "도입 상담은 어떻게 신청하나요?", a: '<a href="/apply">도입 문의</a> 페이지에서 간단히 남겨주시면 영업일 기준 1일 내 담당자가 연락드립니다.', k: ["상담", "신청", "문의", "연락", "도입문의"] },
];
const GREETING = "안녕하세요! AI면접 도우미예요. 🙂<br/>AI 면접 도입에 대해 궁금한 점을 물어보세요.";
const FALLBACK = '정확한 안내를 위해 <a href="/apply">도입 문의</a>를 남겨주시면 담당자가 영업일 기준 1일 내 연락드려요. 아래 자주 묻는 질문도 참고해 보세요!';

type Msg = { who: "bot" | "user"; html: string };

function answerFor(text: string) {
  const t = text.toLowerCase();
  for (const item of KB) if (t.indexOf(item.q.toLowerCase()) >= 0) return item.a;
  for (const item of KB) for (const k of item.k) if (t.indexOf(k.toLowerCase()) >= 0) return item.a;
  return FALLBACK;
}

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    // 답변이 잘 보이도록: 마지막 사용자 질문을 본문 맨 위로 올려 그 아래 답변이 꽉 차게 노출.
    // (질문이 없으면 — 인사말 등 — 기존처럼 맨 아래로)
    const raf = requestAnimationFrame(() => {
      const users = body.querySelectorAll<HTMLElement>(".cbot-msg.user");
      const lastUser = users[users.length - 1];
      body.scrollTop = lastUser ? Math.max(0, lastUser.offsetTop - 14) : body.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [msgs]);

  function botReply(html: string) {
    setTimeout(() => setMsgs((m) => [...m, { who: "bot", html }]), 280);
  }

  function handle(input: string) {
    setMsgs((m) => [...m, { who: "user", html: esc(input) }]);
    botReply(answerFor(input));
  }

  function openPanel() {
    setOpen(true);
    if (!started) {
      setStarted(true);
      botReply(GREETING);
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText("");
    handle(v);
  }

  return (
    <div className={`cbot${open ? " open" : ""}`} id="cbot">
      {!open && (
        <button type="button" className="cbot-fab" aria-label="채팅 문의 열기" onClick={openPanel}>
          <span className="cbot-fab-ico"><i className="fa-solid fa-comment-dots"></i></span>
          <span>
            <span className="cb-t">궁금한 건 채팅으로 문의하세요</span>
            <span className="cb-s">평균 몇 분 내 답변드립니다</span>
          </span>
        </button>
      )}
      <div className="cbot-panel" hidden={!open}>
        <div className="cbot-head">
          <div className="cbot-head-id">
            <span className="cbot-ava"><i className="fa-solid fa-headset"></i></span>
            <div>
              <div className="cbot-name">AI면접 도우미</div>
              <div className="cbot-status">보통 몇 분 내 답변</div>
            </div>
          </div>
          <button type="button" className="cbot-close" aria-label="닫기" onClick={() => setOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="cbot-body" ref={bodyRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`cbot-msg ${m.who}`} dangerouslySetInnerHTML={{ __html: m.html }} />
          ))}
        </div>
        <div className="cbot-quick">
          {KB.filter((item) => item.quick).map((item) => (
            <button type="button" key={item.q} onClick={() => handle(item.q)}>
              <i className={`fa-solid ${item.icon ?? "fa-circle-question"}`} aria-hidden="true"></i>
              <span>{item.q}</span>
            </button>
          ))}
        </div>
        <form className="cbot-input" onSubmit={onSubmit}>
          <input ref={inputRef} type="text" placeholder="메시지를 입력하세요" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" aria-label="전송"><i className="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </div>
  );
}
