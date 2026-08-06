import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Read markdown and strip frontmatter
const raw = readFileSync(
  '/Users/juhee.kim/Desktop/contents_blogs_sns/posts/w3-02-end-of-mass-hiring.md',
  'utf8'
)
const afterFrontmatter = raw.replace(/^---[\s\S]*?---\n/, '')

const { data, error } = await supabase
  .from('posts')
  .update({
    title: '공채가 줄고 수시채용이 늘어난다 — 채용팀은 왜 더 바빠졌나',
    meta_description: 'LG 등 일부 대기업 집단은 정기 공채를 폐지하거나 축소하고 수시채용을 확대했다. 채용 방식 변화가 채용팀 운영의 복잡성을 높이고 있다 — 수시채용이 1차 스크리닝을 어렵게 만드는 이유.',
    content: afterFrontmatter,
    updated_at: new Date().toISOString(),
  })
  .eq('slug', 'end-of-mass-hiring')
  .select('id, title, slug, published, updated_at')

if (error) {
  console.error('ERROR:', error.message)
  process.exit(1)
}

console.log('SUCCESS:', JSON.stringify(data, null, 2))
