import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabase'
import { cn } from '../lib/utils'
import {
  formatFileSize,
  getSignedAttachmentUrl,
  isImageMime,
  parseAttachments,
} from '../lib/chatAttachments'

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-8 bg-[rgba(0,0,0,0.88)] backdrop-blur-sm max-[900px]:bottom-[70px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Náhled obrázku'}
    >
      <button
        type="button"
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded border border-ctrl-border text-ctrl-text2 text-xl leading-none cursor-pointer transition-colors hover:border-ctrl-text hover:text-ctrl-text z-10"
        aria-label="Zavřít"
        onClick={onClose}
      >
        ×
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[calc(100vh-4rem)] w-auto h-auto object-contain select-none"
        onClick={e => e.stopPropagation()}
      />
      {alt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] px-3 py-1.5 text-[11px] font-mono text-ctrl-text2 bg-ctrl-panel/90 border border-ctrl-border truncate">
          {alt}
        </div>
      )}
    </div>,
    document.body
  )
}

export function ChatMessageAttachments({ attachments, isOwn }) {
  const items = parseAttachments(attachments)
  const [urls, setUrls] = useState({})
  const [failed, setFailed] = useState({})
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!items.length) return
    let cancelled = false
    items.forEach(att => {
      getSignedAttachmentUrl(supabase, att.path)
        .then(url => {
          if (!cancelled) setUrls(prev => ({ ...prev, [att.path]: url }))
        })
        .catch(() => {
          if (!cancelled) setFailed(prev => ({ ...prev, [att.path]: true }))
        })
    })
    return () => { cancelled = true }
  }, [attachments])

  if (!items.length) return null

  return (
    <>
      <div className={cn('flex flex-col gap-2 mt-2', items.some(a => isImageMime(a.mime)) && 'mt-2.5')}>
        {items.map(att => {
          const url = urls[att.path]
          const err = failed[att.path]
          if (isImageMime(att.mime) && url) {
            return (
              <button
                key={att.path}
                type="button"
                className="block max-w-[240px] rounded-sm overflow-hidden border border-ctrl-border hover:border-ctrl-accent transition-colors cursor-pointer-in p-0 bg-transparent text-left"
                onClick={e => {
                  e.stopPropagation()
                  setLightbox({ src: url, alt: att.name })
                }}
              >
                <img src={url} alt={att.name} className="max-h-48 w-auto object-contain bg-ctrl-bg pointer-events-none" />
              </button>
            )
          }
          return (
            <a
              key={att.path}
              href={url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 text-[11px] font-mono py-1.5 px-2 border transition-colors max-w-full',
                isOwn
                  ? 'border-[rgba(42,107,255,0.35)] text-ctrl-text hover:border-ctrl-accent'
                  : 'border-ctrl-border text-ctrl-accent hover:border-ctrl-accent',
                !url && 'pointer-events-none opacity-60'
              )}
              onClick={e => { if (!url) e.preventDefault(); e.stopPropagation() }}
            >
              <span className="shrink-0">📎</span>
              <span className="truncate">{att.name}</span>
              <span className="text-ctrl-text3 shrink-0">{formatFileSize(att.size)}</span>
              {err && <span className="text-ctrl-danger shrink-0">nelze načíst</span>}
            </a>
          )
        })}
      </div>
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
