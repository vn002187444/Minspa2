import { createClient } from '@/utils/supabase/server'
import { callGemini } from '@/lib/ai/gemini'
import { logger } from '@/lib/logger'
import { searchImages } from '@/lib/image-search'
import { ensureGeoAlt, generateBlogImageAlt } from '@/lib/image-alt'

const MINSTUDIO_BASE = 'https://minstudio.vn'

const DANCE_SYSTEM = `Bạn là chuyên gia Copywriter SEO cho Min Dance Studio (Lavita Charm, Thủ Đức, TP.HCM) — trung tâm khiêu vũ, nhảy hiện đại, Kpop, Zumba, múa đương đại.
Nhiệm vụ: REVIEW website ${MINSTUDIO_BASE} (đã cung cấp danh mục khóa học, phòng tập, tin tức bên dưới), sinh bộ từ khóa SEO cho Minstudio.vn và viết bài hỗ trợ tăng view/độ phủ cho domain minstudio.vn.

QUY TẮC BẮT BUỘC SEO/GEO/AEO:
- Chỉ viết về khiêu vũ, nhảy, múa, fitness dance — không tư vấn y tế.
- Trước khi viết, phải review site context Minstudio.vn được cung cấp (courses, rooms, news) để bám sát dịch vụ/thông tin có thật, không bịa.
- Trả về JSON đúng schema, đồng thời ngầm sinh keywords cho Minstudio.vn (lồng vào title/meta/content).
- Tiếng Việt có dấu (NFC), giọng trẻ trung, năng động, thân thiện.
- H1 là title (cấm # trong content). Content chỉ ## H2 và ### H3 thuần text (không **), mỗi heading 1 dòng riêng + 1 dòng trống trước/sau.
- Tối thiểu 3 H2, mỗi H2 1-2 H3, 800-1200 từ, sapo 2-3 câu không heading (có Lavita Charm/Thủ Đức 2-3 lần), 40-60 từ đầu mỗi H2 trả lời trực tiếp.
- BACKLINK BẮT BUỘC tới Minstudio.vn: rải 2-3 link dạng [anchor](${MINSTUDIO_BASE}/courses) / /rooms / /news/<slug> / /hiphop / /dance-kids v.v. đã cho, anchor tự nhiên chứa từ khóa dance. Có thể thêm 1 link nội bộ minhair /blog nếu liên quan.
- Luôn có CTA tới Minstudio: [đặt lịch học thử](${MINSTUDIO_BASE}/register) hoặc /booking và hotline 0934 323 878.
- GEO: nhắc "Min Dance Studio - Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức" và 3 cơ sở An Khánh/La Astoria/Lavita Charm.`

const DANCE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Tiêu đề H1 <=70 ký tự, chứa từ khóa nhảy/dance + Thủ Đức/Lavita Charm, tối ưu cho minstudio.vn' },
    metaDescription: { type: 'string', description: 'Meta 140-160 ký tự, chứa từ khóa chính + địa phương + CTA về Min Dance Studio' },
    content: { type: 'string', description: 'Markdown chuẩn: sapo không heading, >=3 H2 thuần text, mỗi H2 1-2 H3, 2-3 backlink https://minstudio.vn/... (courses/rooms/news) rải đều, CTA minstudio register/booking' },
    keywords: { type: 'array', items: { type: 'string' }, description: '5-7 keywords SEO đã review & sinh cho minstudio.vn (VD: nhảy Kpop Thủ Đức, phòng tập Lavita Charm...)' },
  },
  required: ['title', 'metaDescription', 'content'],
}

const DEFAULT_DANCE_TOPICS = [
  'khiêu vũ hiện đại cho người mới bắt đầu tại Thủ Đức',
  'lớp nhảy Kpop cho thiếu nhi Lavita Charm',
  'học nhảy Zumba giảm cân tại Thủ Đức',
  'kỹ thuật múa đương đại cơ bản',
  'combo nhảy + fitness cho dân văn phòng Thủ Đức',
  'lớp nhảy couple dance tại Lavita Charm',
  'bí quyết giữ dáng với Dance Fitness',
  'xu hướng nhảy TikTok 2026 tại Thủ Đức',
  'lớp nhảy cho bé 5-10 tuổi tại Thủ Đức',
  'giải phóng stress với nhảy đương đại',
]

function isScheduledNow(config: any): boolean {
  try {
    const days: string[] = Array.isArray(config.schedule_days) ? config.schedule_days : ['MON','TUE','WED','THU','FRI','SAT','SUN']
    const hour: number = typeof config.schedule_hour === 'number' ? config.schedule_hour : 12
    const now = new Date()
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
    const dayMap = ['SUN','MON','TUE','WED','THU','FRI','SAT']
    const today = dayMap[vn.getDay()]
    const curHour = vn.getHours()
    if (!days.includes(today)) return false
    if (Math.abs(curHour - hour) > 1 && curHour !== hour) return false
    return true
  } catch { return true }
}

async function refillDancePoolIfNeeded(supabase: any): Promise<void> {
  const { data: cfg } = await supabase.from('auto_seo_dance_config').select('topic_pool').eq('id',1).single()
  const pool: string[] = cfg?.topic_pool || []
  if (pool.length >= 5) return
  const { data: recent } = await supabase.from('seo_articles').select('topic').eq('topic_source','auto_dance').order('created_at',{ascending:false}).limit(50)
  const recentSet = new Set((recent||[]).map((r:any)=>r.topic.toLowerCase().trim()))
  let newTopics: string[] = []
  try {
    const res = await callGemini({
      systemInstruction: 'Bạn là strategist SEO cho Min Dance Studio Lavita Charm Thủ Đức. Chỉ trả JSON.',
      prompt: `Tạo 10 chủ đề SEO mới cho lớp nhảy/khiêu vũ/Zumba/múa tại Thủ Đức/Lavita Charm. Tránh trùng: ${Array.from(recentSet).slice(0,20).join(' | ')||'không có'}`,
      jsonSchema: { type:'object', properties:{ topics:{type:'array', items:{type:'string'}}}, required:['topics'] },
      useCache:false,
    })
    if(res.text){ const p=JSON.parse(res.text); newTopics=(p.topics||[]).map((t:string)=>t.trim()).filter(Boolean) }
  } catch(e:any){ logger.error('[DanceSEO] refill failed',e) }
  if(newTopics.length<5){ newTopics=[...newTopics, ...DEFAULT_DANCE_TOPICS.filter(t=>!recentSet.has(t.toLowerCase()))].slice(0,10) }
  const merged=[...pool]
  for(const t of newTopics){ const k=t.toLowerCase().trim(); if(!merged.some(m=>m.toLowerCase().trim()===k) && !recentSet.has(k)) merged.push(t); if(merged.length>=15) break }
  if(merged.length!==pool.length) await supabase.from('auto_seo_dance_config').update({topic_pool:merged, updated_at:new Date().toISOString()}).eq('id',1)
}

export async function pickDanceTopic(): Promise<string|null>{
  const supabase=await createClient()
  await refillDancePoolIfNeeded(supabase)
  const {data:cfg}=await supabase.from('auto_seo_dance_config').select('topic_pool').eq('id',1).single()
  if(!cfg?.topic_pool?.length) return null
  const pool:string[]=cfg.topic_pool
  const {data:recent}=await supabase.from('seo_articles').select('topic').eq('topic_source','auto_dance').order('created_at',{ascending:false}).limit(50)
  const recentSet=new Set((recent||[]).map((r:any)=>r.topic.toLowerCase().trim()))
  const unused=pool.filter(t=>!recentSet.has(t.toLowerCase().trim()))
  const candidates=unused.length?unused:pool
  return candidates[Math.floor(Math.random()*candidates.length)]
}

async function fetchMinStudioContext(): Promise<string> {
  const base = MINSTUDIO_BASE
  const staticFallback = `=== MINSTUDIO.VN — THÔNG TIN CỐ ĐỊNH ===
Thương hiệu: Min Dance Studio — Dance Your Way — 3 cơ sở: An Khánh (28 Nguyễn Quý Đức), La Astoria (383 Nguyễn Duy Trinh), Lavita Charm (Shophouse TM14, Lavita Charm, Trường Thọ, Thủ Đức)
Hotline: 0934 323 878 — Email: admin@minstudio.vn
Courses nổi bật: HIPHOP -> ${base}/hiphop, DANCE KIDS -> ${base}/dance-kids, DANCE BAR -> ${base}/dance-bar, TREND TIKTOK -> ${base}/trend-tiktok, MÚA CỔ TRANG -> ${base}/mua-co-trang, COVER DANCE -> ${base}/cover-dance, SEXY DANCE -> ${base}/sexy-dance
Danh mục: Khóa học ${base}/courses, Phòng nhảy ${base}/rooms, Lịch ${base}/schedule, Giảng viên ${base}/teachers, Tin tức ${base}/news
Tin mới: Dàn dựng nhảy đám cưới -> ${base}/dan-dung-tiet-muc-nhay-dam-cuoi-doc-dao-min-dance-studio, Strip Dance -> ${base}/giai-phong-ve-dep-tiem-an-qua-strip-dance, Biên đạo sự kiện -> ${base}/dich-vu-bien-dao-nhay-su-kien-thu-duc-min-dance-studio`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const [homeRes, courseRes] = await Promise.allSettled([
      fetch(`${base}/sitemap.xml`, { signal: controller.signal, headers: { 'User-Agent': 'MinSEO-Bot' } }).then(r => r.ok ? r.text() : ''),
      fetch(`${base}/courses`, { signal: controller.signal, headers: { 'User-Agent': 'MinSEO-Bot' } }).then(r => r.ok ? r.text() : ''),
    ])
    clearTimeout(timeout)
    const parts: string[] = [staticFallback]
    if (homeRes.status === 'fulfilled' && homeRes.value) {
      const sitemapSnippet = homeRes.value.slice(0, 4000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (sitemapSnippet) parts.push(`=== SITEMAP MINSTUDIO.VN (trích) ===\n${sitemapSnippet.slice(0, 1500)}`)
    }
    if (courseRes.status === 'fulfilled' && courseRes.value) {
      const text = courseRes.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
      if (text) parts.push(`=== COURSES PAGE TRÍCH ===\n${text.slice(0, 1200)}`)
    }
    return parts.join('\n\n')
  } catch {
    return staticFallback
  }
}

function ensureDanceHeadings(content:string, siteLinks:string[]):string{
  let out=content.replace(/\r/g,'').trim().normalize('NFC')
  out=out.replace(/([^\n])\s*##\s+/g,'$1\n\n## ')
  out=out.replace(/([^\n])\s*###\s+/g,'$1\n\n### ')
  out=out.replace(/^#\s+(.*)$/gm,'## $1')
  out=out.replace(/^##\s*\*\*(.*?)\*\*\s*$/gm,'## $1')
  out=out.replace(/^###\s*\*\*(.*?)\*\*\s*$/gm,'### $1')
  const h2=(out.match(/^##\s+/gm)||[]).length
  if(h2<3) out+=`\n\n## Tại sao chọn Min Dance Studio Lavita Charm\nTrải nghiệm không gian gương rộng, sàn gỗ, giáo viên tận tâm. [đặt lịch ngay](${MINSTUDIO_BASE}/register) để giữ chỗ.\n`
  if(!out.includes('minstudio.vn')) {
    const picks = siteLinks.slice(0,2)
    if(picks.length) out += `\n\n> Gợi ý: Khám phá [khóa học tại Min Dance Studio](${picks[0]}) và [phòng tập](${MINSTUDIO_BASE}/rooms).\n`
  }
  if(!out.includes('/booking') && !out.includes('/register')) out+=`\n\n## Đặt lịch học thử miễn phí\n[đặt lịch ngay](${MINSTUDIO_BASE}/register) hoặc gọi 0934 323 878 — Min Dance Studio, TM14 Lavita Charm, Trường Thọ, Thủ Đức.`
  if((out.match(/Lavita Charm|Thủ Đức/g)||[]).length<2) out+=`\n\n> Min Dance Studio — Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức. Hotline 0934 323 878.\n`
  // đảm bảo có backlink minstudio.vn rải đều
  const hasMinStudioLink = /minstudio\.vn/.test(out)
  if(!hasMinStudioLink && siteLinks.length){
    out += `\n\n> Xem thêm tại Min Dance Studio: [Min Dance Studio](${MINSTUDIO_BASE}) — [Khóa học](${MINSTUDIO_BASE}/courses).\n`
  }
  return out
}

export async function generateDanceArticle(topic:string):Promise<{title:string;content:string;summary:string}|null>{
  const supabase=await createClient()
  const {data:blogs}=await supabase.from('blogs').select('title,slug').eq('published',true).order('created_at',{ascending:false}).limit(6)
  const blogCtx=(blogs||[]).map((b:any)=>`- ${b.title} -> /blog/${b.slug}`).join('\n')||'Không có'
  const studioCtx = await fetchMinStudioContext()
  const prompt=`Viết bài SEO về: "${topic}"
Thương hiệu: Min Dance Studio — Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức — Hotline 0934 323 878 — /booking
Context MINSTUDIO.VN (đã review — bám sát để không bịa):
${studioCtx.slice(0,2500)}
Bài blog gần đây để backlink (nếu liên quan):
${blogCtx}
Yêu cầu: sapo 2-3 câu không heading (có Lavita Charm/Thủ Đức), >=3 H2 thuần text, mỗi H2 1-2 H3, 2-3 link minstudio.vn/courses|rooms|news + 1-2 link /blog/slug nếu liên quan, CTA /register minstudio.`
  const minStudioLinks = [
    `${MINSTUDIO_BASE}/courses`,
    `${MINSTUDIO_BASE}/rooms`,
    `${MINSTUDIO_BASE}/hiphop`,
    `${MINSTUDIO_BASE}/dance-kids`,
    `${MINSTUDIO_BASE}/news`,
  ]
  const siteLinks = [...minStudioLinks, ...(blogs||[]).map((b:any)=>`/blog/${b.slug}`).slice(0,2)]
  const res=await callGemini({ systemInstruction: DANCE_SYSTEM, prompt, jsonSchema: DANCE_SCHEMA, useCache:true })
  if(!res.text) return null
  try{
    const p=JSON.parse(res.text)
    let c=ensureDanceHeadings(p.content||'', siteLinks)
    // append keywords if returned
    if (Array.isArray((p as any).keywords) && (p as any).keywords.length) {
      c += `\n\n<!-- keywords: ${(p as any).keywords.join(', ')} -->`
    }
    return { title:(p.title||topic).normalize('NFC').slice(0,70), content:c, summary:(p.metaDescription||'').normalize('NFC').slice(0,160) }
  }catch{return null}
}

async function publishDanceToBlog(supabase:any,title:string,content:string,summary:string,topic:string){
  const slug=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,200)||'dance-'+Date.now()
  const now=new Date().toISOString()
  // image theo chủ đề dance
  let imageUrl:string|undefined
  let imageAlt:string|undefined
  try{
    const r=await searchImages(topic+' dance studio',1)
    if(r.images[0]){ imageUrl=r.images[0]; imageAlt=r.imageAlts[0] }
  }catch{}
  if(!imageUrl) imageUrl='https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&auto=format&fit=crop'
  const {ensureGeoAlt, generateBlogImageAlt}=await import('@/lib/image-alt')
  if(!imageAlt) imageAlt=ensureGeoAlt(generateBlogImageAlt(title), title)
  const {data:exist}=await supabase.from('blogs').select('id').eq('slug',slug).maybeSingle()
  if(exist) return null
  const {error}=await supabase.from('blogs').insert({
    title, slug, summary, content, image_url:imageUrl, image_alt:ensureGeoAlt(imageAlt,title).normalize('NFC'),
    keywords: 'dance, khiêu vũ, nhảy, Min Dance Studio, Thủ Đức, Lavita Charm',
    published:true, published_at:now, created_at:now, updated_at:now,
  })
  if(error){ logger.error('[DanceSEO] insert failed',error); return null}
  return slug
}

export async function runDanceSeo(opts?:{force?:boolean}):Promise<{success:boolean;message:string}>{
  const supabase=await createClient()
  try{
    const {data:cfg}=await supabase.from('auto_seo_dance_config').select('*').eq('id',1).single()
    if(!cfg?.enabled) return {success:false, message:'Dance SEO disabled'}
    if(!opts?.force && !isScheduledNow(cfg)) return {success:false, message:`Not scheduled (days=${cfg.schedule_days} hour=${cfg.schedule_hour})`}
    await refillDancePoolIfNeeded(supabase)
    const topic=await pickDanceTopic()
    if(!topic) return {success:false, message:'No dance topic'}
    const article=await generateDanceArticle(topic)
    if(!article) return {success:false, message:'Generate failed'}
    const slug=await publishDanceToBlog(supabase, article.title, article.content, article.summary, topic)
    if(!slug) return {success:false, message:'Publish failed'}
    try{ const {revalidatePath}=await import('next/cache'); revalidatePath('/blog'); revalidatePath(`/blog/${slug}`); revalidatePath('/sitemap.xml')}catch{}
    const id='art_'+Math.random().toString(36).slice(2,11)
    await supabase.from('seo_articles').insert({ id, topic, keywords:'dance, nhảy, khiêu vũ, Thủ Đức', article:article.content, status:'published', topic_source:'auto_dance', blog_slug:slug, created_at:new Date().toISOString(), published_at:new Date().toISOString() })
    // consume topic
    const {data:cfg2}=await supabase.from('auto_seo_dance_config').select('topic_pool').eq('id',1).single()
    const pool2:string[]=cfg2?.topic_pool||[]
    const idx=pool2.findIndex((t:string)=>t.toLowerCase().trim()===topic.toLowerCase().trim())
    if(idx!==-1){ pool2.splice(idx,1); await supabase.from('auto_seo_dance_config').update({topic_pool:pool2, updated_at:new Date().toISOString()}).eq('id',1)}
    logger.info('[DanceSEO] Published', {topic, slug})
    return {success:true, message:`Published dance "${article.title}"`}
  }catch(err:any){ logger.error('[DanceSEO] failed',err); return {success:false, message:err.message}}
}
