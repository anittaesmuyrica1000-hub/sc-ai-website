-- 블로그 14개 초안 SEO 최적화 — B2B 대기업 채용팀 검색 키워드 타깃
-- meta_title(검색 제목)·meta_description(검색 설명)·tags(키워드) 갱신. 본문/제목/커버는 유지(정렬됨).
-- Supabase → SQL Editor에 붙여넣고 실행. (MCP 읽기전용이라 코드로는 실행 불가)

-- g1 구조화 면접 질문 설계
update posts set
  meta_title = '구조화 면접 질문 설계법 | AI 면접 검증 · Supercoder',
  meta_description = '예상 질문을 외운 지원자도 걸러내는 구조화 면접 질문 설계 원칙. 대기업 채용팀을 위한 AI 면접 검증 가이드.',
  tags = array['구조화면접','면접질문','AI면접','채용검증','대기업채용']
where id = '9f226d06-dd66-44ac-adce-b54bca74b78d';

-- g2 1차 스크리닝 역량 검증
update posts set
  meta_title = '1차 스크리닝 역량 검증법 | AI 면접 · Supercoder',
  meta_description = '완벽히 준비된 지원자 사이에서 진짜 직무 역량을 가려내는 1차 스크리닝 기준. 채용팀 검증 실무 가이드.',
  tags = array['1차스크리닝','역량검증','채용검증','AI면접','채용담당자']
where id = '2d62212f-e178-4712-a0dd-693706652ab7';

-- g3 AI 역량검사 vs AI 면접
update posts set
  meta_title = 'AI 역량검사 vs AI 면접 비교 | 채용 검증 · Supercoder',
  meta_description = '인적성·AI 역량검사만으로 부족한 이유와 AI 면접의 검증 범위 비교. 대기업 채용 검증 도구 선택 가이드.',
  tags = array['AI역량검사','AI면접','채용검증','인적성검사','역량평가']
where id = 'cf481cd8-171e-4e47-9354-e41d6c8c9138';

-- g4 1차 스크리닝 7가지 신호
update posts set
  meta_title = 'AI 면접 1차 스크리닝 위험 신호 7가지 | Supercoder',
  meta_description = '서류·필기로는 안 보이는 지원자 위험 신호 7가지. 대량 채용 1차 스크리닝에서 AI 면접이 걸러내는 것.',
  tags = array['1차스크리닝','대량채용','AI면접','채용검증','채용리스크']
where id = 'fc519b0b-a8d7-44f4-a2b6-9ec8f18cd3df';

-- n1 부정행위 탐지
update posts set
  meta_title = 'AI 면접 부정행위 탐지 | 비대면 채용 무결성 · Supercoder',
  meta_description = '생성형 AI로 진화하는 원격·비대면 면접 부정행위와 탐지 기술. 대기업 비대면 채용의 무결성 확보 방안.',
  tags = array['면접부정행위','비대면채용','원격면접','AI면접','채용무결성']
where id = '1c238f61-daa9-4210-be20-35b0a4b9edd1';

-- n2 AI 채용 공정성
update posts set
  meta_title = 'AI 채용 공정성·편향 관리 | AI 면접 · Supercoder',
  meta_description = 'AI 채용의 편향 리스크와 공정성 확보 방법. 대기업이 AI 면접 도입 시 반드시 점검할 공정성 기준.',
  tags = array['AI채용','채용공정성','채용편향','블라인드채용','AI면접']
where id = '5bc2b76e-fdaf-4b0f-9644-fae10f52474d';

-- n3 대화형 AI 면접 장단점
update posts set
  meta_title = '대화형 AI 면접 장단점 정리 | AI 면접 · Supercoder',
  meta_description = '대화형 AI 면접의 장점과 한계, 지원자 경험과 검증력의 균형. 대기업 채용 도입 전 체크포인트.',
  tags = array['대화형AI면접','AI면접','지원자경험','채용검증','비대면면접']
where id = '73927f7a-77fe-4b9c-a7f2-6fb0b123c0bb';

-- n4 역량 중심(스킬 기반) 채용
update posts set
  meta_title = '역량 중심·스킬 기반 채용 가이드 | 채용 트렌드 · Supercoder',
  meta_description = '학벌·스펙 대신 직무 역량으로 뽑는 스킬 기반 채용. AI가 이끄는 역량 중심 채용 전환 가이드.',
  tags = array['역량중심채용','스킬기반채용','채용트렌드','직무역량','AI채용']
where id = '5fa7defc-1d1d-4637-b5b1-c8d4a3f47a07';

-- n5 에이전틱 AI 채용 자동화 경계
update posts set
  meta_title = '에이전틱 AI 채용 자동화, 어디까지 | HR AX · Supercoder',
  meta_description = '채용 자동화(에이전틱 AI)의 효율과 사람 판단의 균형점. 대기업 HR의 AI 전환(AX) 도입 원칙.',
  tags = array['에이전틱AI','채용자동화','HR테크','채용AX','AI채용']
where id = '89284973-f240-4a7f-b6c7-59a37568003c';

-- n6 채용 예측타당도
update posts set
  meta_title = '채용 예측타당도 — 스펙과 성과 | HR 인사이트 · Supercoder',
  meta_description = '학벌·스펙의 낮은 예측타당도와 성과를 예측하는 채용 지표. 데이터로 보는 대기업 채용 기준.',
  tags = array['예측타당도','채용지표','역량검증','성과예측','HR데이터']
where id = '14302a5b-9737-4086-9de4-ed7905da505c';

-- n7 채용 AI 프롬프트 모음
update posts set
  meta_title = '채용 담당자용 AI 프롬프트 모음(실무 템플릿) | Supercoder',
  meta_description = '채용 공고·서류 평가·면접 리포트를 위한 AI 프롬프트 템플릿. 채용팀이 바로 복붙해 쓰는 실무 모음.',
  tags = array['채용프롬프트','AI프롬프트','채용자동화','채용담당자','ChatGPT채용']
where id = 'be68a713-7c51-40c6-9696-a662919ac5f7';

-- n8 AI 면접 도입 ROI
update posts set
  meta_title = 'AI 면접 도입 ROI·효과 데이터 | AI 면접 · Supercoder',
  meta_description = 'AI 면접 도입 기업의 채용 기간·비용 절감 ROI 데이터. 대기업 채용팀의 도입 의사결정 근거.',
  tags = array['AI면접ROI','AI면접도입','채용비용','채용효율화','채용자동화']
where id = '89cf45ff-0d75-4c0e-b13c-e15f660bca27';

-- n9 채용 프로세스 자동화(AX) 5단계
update posts set
  meta_title = '채용 프로세스 자동화(AX) 5단계 | 채용 자동화 · Supercoder',
  meta_description = '채용을 AX(AI 전환)하는 5단계 로드맵과 우선 도입 지점. 대기업 채용 프로세스 자동화 실행 가이드.',
  tags = array['채용프로세스자동화','채용AX','채용자동화','AI채용','HR테크']
where id = 'e8538e89-99d4-46ec-abc3-f7cc04a1a46a';

-- n10 HR AX 시작점: AI 1차 스크리닝
update posts set
  meta_title = 'HR AX 시작점: AI 1차 스크리닝 | 채용 트렌드 · Supercoder',
  meta_description = '자소서 AI 시대, HR의 AX를 어디서 시작할까. 가짜 이력서 대신 AI 1차 스크리닝으로 검증하는 법.',
  tags = array['HR AX','AI1차스크리닝','가짜이력서','채용검증','채용트렌드']
where id = '21fb1a11-8a5e-40da-bc7e-901afcad1eba';

-- (선택) 검토 후 공개 전환하려면 아래 주석 해제:
-- update posts set published = true where id in (
--   '9f226d06-dd66-44ac-adce-b54bca74b78d','2d62212f-e178-4712-a0dd-693706652ab7',
--   'cf481cd8-171e-4e47-9354-e41d6c8c9138','fc519b0b-a8d7-44f4-a2b6-9ec8f18cd3df',
--   '1c238f61-daa9-4210-be20-35b0a4b9edd1','5bc2b76e-fdaf-4b0f-9644-fae10f52474d',
--   '73927f7a-77fe-4b9c-a7f2-6fb0b123c0bb','5fa7defc-1d1d-4637-b5b1-c8d4a3f47a07',
--   '89284973-f240-4a7f-b6c7-59a37568003c','14302a5b-9737-4086-9de4-ed7905da505c',
--   'be68a713-7c51-40c6-9696-a662919ac5f7','89cf45ff-0d75-4c0e-b13c-e15f660bca27',
--   'e8538e89-99d4-46ec-abc3-f7cc04a1a46a','21fb1a11-8a5e-40da-bc7e-901afcad1eba');
