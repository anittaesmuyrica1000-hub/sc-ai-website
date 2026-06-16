"use client";

import { useEffect, useRef, useState } from "react";

// 채팅 도우미(챗봇) — FAQ 기반 응답 + 도입 문의 연결. 백엔드 없이 동작. 스타일은 theme.css(.cbot*).
type KbItem = { q: string; a: string; k: string[] };
const KB: KbItem[] = [
  { q: "AI 면접은 어떻게 진행되나요?", a: "지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AI면접이 응답을 분석·검증해 역량 평가와 핵심 요약 리포트를 만들고, 채용팀에는 검증을 통과한 상위 후보의 리포트만 전달됩니다.", k: ["면접", "진행", "어떻게", "응시", "방식"] },
  { q: "기존 ATS·채용 툴과 연동되나요?", a: "네, 주요 ATS·채용 툴과의 연동을 지원합니다. 구체적인 연동 방식은 도입 문의 시 환경에 맞게 안내해 드려요.", k: ["ats", "연동", "툴", "통합", "연결"] },
  { q: "도입까지 얼마나 걸리나요?", a: "환경에 따라 다르지만 빠르게 시작하실 수 있습니다. 도입 문의를 남겨주시면 일정과 함께 안내드려요.", k: ["도입", "기간", "얼마나", "시작", "언제", "소요"] },
  { q: "지원자 데이터는 안전한가요?", a: "지원자 데이터는 안전하게 암호화되어 관리되며 관련 법규를 준수합니다. 자세한 보안 정책은 개인정보처리방침에서 확인하실 수 있어요.", k: ["데이터", "보안", "안전", "개인정보", "보호"] },
  { q: "비용은 어떻게 되나요?", a: "채용 규모와 활용 범위에 따라 맞춤 견적으로 안내드립니다. 도입 문의를 남겨주시면 상세 견적을 드려요.", k: ["비용", "가격", "요금", "견적", "얼마"] },
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
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
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
          {KB.map((item) => (
            <button type="button" key={item.q} onClick={() => handle(item.q)}>{item.q}</button>
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
