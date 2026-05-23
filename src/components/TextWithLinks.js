import { Fragment } from 'react'
import { cn } from '../lib/utils'

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g

function isSafeUrl(url) {
  return /^https?:\/\//i.test(url.trim())
}

export function TextWithLinks({ text, className, linkClassName }) {
  if (!text) return null

  const parts = []
  let lastIndex = 0
  let match

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index), key: `t-${lastIndex}` })
    }

    const [, label, url] = match
    parts.push({
      type: isSafeUrl(url) ? 'link' : 'text',
      value: isSafeUrl(url) ? { label, url: url.trim() } : match[0],
      key: `l-${match.index}`,
    })
    lastIndex = LINK_RE.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex), key: `t-${lastIndex}` })
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {parts.map(part =>
        part.type === 'link' ? (
          <a
            key={part.key}
            href={part.value.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('text-ctrl-accent underline hover:text-ctrl-accent2', linkClassName)}
            onClick={e => e.stopPropagation()}
          >
            {part.value.label}
          </a>
        ) : (
          <Fragment key={part.key}>{part.value}</Fragment>
        )
      )}
    </span>
  )
}
