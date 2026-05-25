import { bucketToSlug } from './bucketSlug'

export const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments'
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_MESSAGE = 5
const SIGNED_URL_TTL_SEC = 3600

const ALLOWED_MIME_PREFIXES = ['image/']
const ALLOWED_MIME_EXACT = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

export function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageMime(mime) {
  return typeof mime === 'string' && mime.startsWith('image/')
}

export function parseAttachments(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(a => a?.path)
  return []
}

function sanitizeFileName(name) {
  const base = (name || 'soubor').replace(/[/\\]/g, '_').trim() || 'soubor'
  return base.slice(0, 120)
}

export function validateChatAttachment(file) {
  if (!file) return 'Soubor nebyl vybrán.'
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Soubor je příliš velký (max ${formatFileSize(MAX_ATTACHMENT_BYTES)}).`
  }
  const mime = file.type || ''
  const ok =
    ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p)) ||
    ALLOWED_MIME_EXACT.has(mime) ||
    (!mime && /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|png|jpe?g|gif|webp)$/i.test(file.name))
  if (!ok) {
    return 'Nepodporovaný typ souboru (obrázky, PDF, Office, TXT).'
  }
  return null
}

export function buildStoragePath(chatBucket, userId, file) {
  const slug = bucketToSlug(chatBucket)
  const id = crypto.randomUUID()
  const safeName = sanitizeFileName(file.name)
  return `${slug}/${userId}/${id}-${safeName}`
}

export async function uploadChatAttachments(supabase, chatBucket, userId, files) {
  const uploaded = []
  for (const file of files) {
    const err = validateChatAttachment(file)
    if (err) throw new Error(err)
    const path = buildStoragePath(chatBucket, userId, file)
    const { error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    uploaded.push({
      path,
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
    })
  }
  return uploaded
}

export async function getSignedAttachmentUrl(supabase, path) {
  const { data, error } = await supabase.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC)
  if (error) throw error
  return data.signedUrl
}

export async function removeChatAttachments(supabase, attachments) {
  const paths = parseAttachments(attachments).map(a => a.path)
  if (!paths.length) return
  await supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).remove(paths)
}
