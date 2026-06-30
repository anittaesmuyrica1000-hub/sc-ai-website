-- 개인정보처리방침(privacy) 병합 업데이트 2026-06-30
-- 라이브의 정식 PIPA 정책(제1조~제12조)은 그대로 두고, 라이브에 없는 신규 내용만 제4조에 병합.
--   (1) 제4조 수탁업체 표에 Azure OpenAI Service / Azure AI Services(STT) 행 추가
--   (2) 제4조에 'LLM 학습·재학습·개선 미사용 + Azure OpenAI' 문장 추가
-- 본문은 마크다운으로 저장돼 있어 앵커 문자열 기준으로 수술적 치환.
-- 모든 UPDATE는 가드(WHERE) 포함 — 앵커 없거나 이미 적용된 경우 자동 no-op(중복 실행 안전).
-- version 컬럼은 정수형이므로 건드리지 않음.
-- Supabase SQL Editor에서 Run.

-- ── (1) 제4조 수탁업체 표에 Azure OpenAI / STT 행 추가 ─────────────────────
update public.legal_docs
set body = replace(
      body,
      $anchor1$| Agora | AI 면접 실시간 영상/음성 스트리밍 전송 / 저장되지 않음 | 실시간 면접 영상 및 음성 데이터 | 저장되지 않음 |$anchor1$,
      $repl1$| Agora | AI 면접 실시간 영상/음성 스트리밍 전송 / 저장되지 않음 | 실시간 면접 영상 및 음성 데이터 | 저장되지 않음 |
| Microsoft (Azure OpenAI Service) | AI 면접 리포트 생성·요약·역량 평가·질문 생성 등 LLM 추론 / 한국 | 면접 전사 텍스트, 이력서 텍스트(음성 미전송) | AI 면접일로부터 1년까지 |
| Microsoft (Azure AI Services) | 면접 음성의 텍스트 변환(STT) / 한국 | 면접 음성 및 변환된 텍스트 | AI 면접일로부터 1년까지 |$repl1$
    ),
    updated_at = now()
where slug = 'privacy'
  and body like '%| Agora | AI 면접 실시간 영상/음성 스트리밍 전송 / 저장되지 않음 | 실시간 면접 영상 및 음성 데이터 | 저장되지 않음 |%'
  and body not like '%Azure OpenAI Service)%';

-- ── (2) 제4조에 LLM 학습 미사용 + Azure OpenAI 문장 추가(제2항 끝에 append) ──
update public.legal_docs
set body = replace(
      body,
      $anchor2$수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.$anchor2$,
      $repl2$수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다. 특히, 면접 프롬프트·전사·녹화 및 그 산출물은 어떠한 대규모 언어모델(LLM)의 학습·재학습·개선에도 사용되지 않으며, Azure OpenAI 서비스 약관상 고객의 프롬프트와 완성결과(completion)는 OpenAI에 공유되지 않고 고객 간(cross-customer)으로도 이용되지 않습니다.$repl2$
    ),
    updated_at = now()
where slug = 'privacy'
  and body like '%수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.%'
  and body not like '%학습·재학습·개선에도 사용되지 않으며%';

-- ── 확인 ──────────────────────────────────────────────────────────────────
select slug, version, effective_date, length(body) as body_len,
       (body like '%Azure OpenAI Service)%')            as has_aoai_row,
       (body like '%Azure AI Services)%')               as has_stt_row,
       (body like '%학습·재학습·개선에도 사용되지 않으며%') as has_llm_clause
from public.legal_docs where slug = 'privacy';
