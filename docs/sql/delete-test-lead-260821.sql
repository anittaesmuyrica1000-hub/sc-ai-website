-- ============================================================
-- 테스트/스팸 리드 1건 즉시 삭제 (보유기간 파기와 별개)
-- 배경: 어드민의 파기 버튼은 보유기간(1년) 경과 건만 지운다.
--       purge_expired_leads()도 서버에서 만료 여부를 재검사하므로
--       내부 테스트 제출은 어드민에서 지울 방법이 없다.
-- 실행: Supabase 대시보드 → SQL Editor. ①로 대상을 확인한 뒤 ②에서 id를 넣고 실행.
-- ⚠️ 되돌릴 수 없습니다. 반드시 ①에서 눈으로 확인하고 id를 복사해 쓰세요.
-- ============================================================

-- ① 최근 제출 확인 — 어느 것이 테스트인지 눈으로 고른다 -------
select id, created_at, name, company, email, status
from public.signups
order by created_at desc
limit 20;

select id, created_at, name, company, email
from public.brochure_requests
order by created_at desc
limit 20;


-- ② 고른 id 1건만 삭제 --------------------------------------
-- 도입문의인 경우 (아래 UUID를 ①에서 복사한 값으로 교체)
-- delete from public.signups
-- where id = '00000000-0000-0000-0000-000000000000'
-- returning id, created_at, name, company, email;

-- 소개서 신청인 경우
-- delete from public.brochure_requests
-- where id = '00000000-0000-0000-0000-000000000000'
-- returning id, created_at, name, company, email;


-- ③ (선택) 삭제 증적 남기기 ---------------------------------
-- 보유기간 만료 파기는 아니지만, 어느 건을 왜 지웠는지 기록해 두고 싶을 때.
-- ②의 returning 값을 보고 아래를 채워 실행한다.
-- insert into public.retention_purges (source, record_id, company, basis_at, purged_by)
-- values ('signups', '00000000-0000-0000-0000-000000000000', '<회사명>', now(), '<관리자 이메일>');


-- ④ 확인 ----------------------------------------------------
-- select count(*) from public.signups;
-- select count(*) from public.brochure_requests;
