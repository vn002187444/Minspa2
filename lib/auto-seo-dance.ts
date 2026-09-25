import { createClient } from '@/utils/supabase/server'
import { callGemini } from '@/lib/ai/gemini'
import { logger } from '@/lib/logger'
import { searchImages } from '@/lib/image-search'
import { ensureGeoAlt, generateBlogImageAlt } from '@/lib/image-alt'

const DANCE_SYSTEM = `Bạn là chuyên gia Copywriter SEO cho Min Dance Studio (Lavita Charm, Thủ Đức, TP.HCM) — trung tâm khiêu vũ, nhảy hiện đại, Kpop, Zumba, múa đương đại.

QUY TẮC BẮT BUỘC SEO/GEO/AEO:
- Chỉ viết về khiêu vũ, nhảy, múa, fitness dance — không tư vấn y tế.
- Trả về JSON đúng schema.
- Tiếng Việt có dấu (NFC), giọng trẻ trung, năng động, thân thiện.
- H1 là title (cấm # trong content). Content chỉ ## H2 và ### H3 thuần text (không **), mỗi heading 1 dòng riêng + 1 dòng trống trước/sau.
- Tối thiểu 3 H2, mỗi H2 1-2 H3, 800-1200 từ, sapo 2-3 câu không heading (có Lavita Charm/Thủ Đức 2-3 lần), 40-60 từ đầu mỗi H2 trả lời trực tiếp.
- Rải 2-3 backlink nội bộ [anchor](/dich-vu/slug) hoặc /blog/slug (nếu có dịch vụ dance) và luôn có CTA /booking + hotline 0934 323 878.
- GEO: nhắc "Min Dance Studio - Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức".`

const DANCE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Tiêu đề H1 <=70 ký tự, chứa từ khóa nhảy/dance + Thủ Đức/Lavita Charm' },
    metaDescription: { type: 'string', description: 'Meta 140-160 ký tự, chứa từ khóa + địa phương + CTA' },
    content: { type: 'string', description: 'Markdown chuẩn: sapo không heading, >=3 H2 thuần text, mỗi H2 1-2 H3, 2-3 backlink /dich-vu hoặc /blog, CTA /booking' },
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

function ensureDanceHeadings(content:string):string{
  let out=content.replace(/\r/g,'').trim().normalize('NFC')
  out=out.replace(/([^\n])\s*##\s+/g,'$1\n\n## ')
  out=out.replace(/([^\n])\s*###\s+/g,'$1\n\n### ')
  out=out.replace(/^#\s+(.*)$/gm,'## $1')
  out=out.replace(/^##\s*\*\*(.*?)\*\*\s*$/gm,'## $1')
  out=out.replace(/^###\s*\*\*(.*?)\*\*\s*$/gm,'### $1')
  const h2=(out.match(/^##\s+/gm)||[]).length
  if(h2<3) out+=`\n\n## Tại sao chọn Min Dance Studio Lavita Charm\nTrải nghiệm không gian gương rộng, sàn gỗ, giáo viên tận tâm. [đặt lịch ngay](/booking) để giữ chỗ.\n`
  if(!out.includes('/booking')) out+=`\n\n## Đặt lịch học thử miễn phí\n[đặt lịch ngay](/booking) hoặc gọi 0934 323 878 — Min Dance Studio, TM14 Lavita Charm, Trường Thọ, Thủ Đức.`
  if((out.match(/Lavita Charm|Thủ Đức/g)||[]).length<2) out+=`\n\n> Min Dance Studio — Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức. Hotline 0934 323 878.\n`
  return out
}

export async function generateDanceArticle(topic:string):Promise<{title:string;content:string;summary:string}|null>{
  const supabase=await createClient()
  const {data:blogs}=await supabase.from('blogs').select('title,slug').eq('published',true).order('created_at',{ascending:false}).limit(6)
  const blogCtx=(blogs||[]).map((b:any)=>`- ${b.title} -> /blog/${b.slug}`).join('\n')||'Không có'
  const prompt=`Viết bài SEO về: "${topic}"
Thương hiệu: Min Dance Studio — Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức — Hotline 0934 323 878 — /booking
Bài blog gần đây để backlink (nếu liên quan):
${blogCtx}
Yêu cầu: sapo 2-3 câu không heading (có Lavita Charm/Thủ Đức), >=3 H2 thuần text, mỗi H2 1-2 H3, 2-3 link /blog/slug nếu liên quan, CTA /booking.`
  const res=await callGemini({ systemInstruction: DANCE_SYSTEM, prompt, jsonSchema: DANCE_SCHEMA, useCache:true })
  if(!res.text) return null
  try{
    const p=JSON.parse(res.text)
    let c=ensureDanceHeadings(p.content||'')
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
