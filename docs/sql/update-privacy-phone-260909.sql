-- 개인정보처리방침 제11조 전화번호 변경: 0507-1322-0473 → 1544-3160 (2026-09-09)
-- 현재 게시본(legal_docs)과 같은 버전의 이력 사본(legal_doc_versions v14)을 함께 갱신한다.
-- 이전 버전(v8~v13)은 당시 시점의 기록이므로 손대지 않는다.
-- 버전/시행일은 그대로 둔다(연락처 정정, 개정 아님).

begin;

update legal_docs
   set body = replace(body, '0507-1322-0473', '1544-3160'),
       updated_at = now()
 where slug = 'privacy'
   and body like '%0507-1322-0473%';

update legal_doc_versions
   set body = replace(body, '0507-1322-0473', '1544-3160')
 where slug = 'privacy'
   and version = 14
   and body like '%0507-1322-0473%';

-- 확인: has_new = true, has_old = false 여야 한다
select 'legal_docs' as src, version,
       position('1544-3160' in body) > 0       as has_new,
       position('0507-1322-0473' in body) > 0  as has_old
  from legal_docs where slug = 'privacy'
union all
select 'legal_doc_versions', version,
       position('1544-3160' in body) > 0,
       position('0507-1322-0473' in body) > 0
  from legal_doc_versions where slug = 'privacy' and version = 14;

commit;
