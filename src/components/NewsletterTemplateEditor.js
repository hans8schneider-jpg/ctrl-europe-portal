import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import grapesjs from 'grapesjs'
import newsletterPreset from 'grapesjs-preset-newsletter'
import 'grapesjs/dist/css/grapes.min.css'

export const WELCOME_TEMPLATE_NAME = 'Přihlášení k newsletteru'
export const WELCOME_TEMPLATE_SUBJECT = 'Jste přihlášeni — CTRL Europe'

export const WELCOME_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <title>Jste přihlášeni.</title>
    <style type="text/css">
      html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
      body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { border-collapse: collapse; }
      img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
      a { text-decoration: none; }
      @media only screen and (max-width: 620px) {
        .email-outer { padding: 20px 12px 28px !important; }
        .email-hero { padding: 22px 18px 20px !important; border-radius: 10px 10px 0 0 !important; }
        .email-body { padding: 22px 18px !important; border-radius: 0 0 10px 10px !important; }
        .email-headline { font-size: 24px !important; line-height: 1.2 !important; }
        .email-summary { padding: 16px !important; }
        .email-row-label, .email-row-value { display: block !important; width: 100% !important; }
        .email-cta-cell { display: block !important; width: 100% !important; padding: 0 0 10px !important; }
        .email-cta-link { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f3;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0b1020;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3;width:100%;">
      <tr>
        <td class="email-outer" align="center" style="padding:40px 20px 48px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding:0 0 28px;text-align:center;">
                <a href="https://ctrleurope.com" style="text-decoration:none;">
                  <img src="https://ctrleurope.com/ctrl_logo_bez_pozadi.png" alt="CTRL Europe" width="148" style="display:inline-block;width:148px;max-width:100%;height:auto;border:0;" />
                </a>
              </td>
            </tr>
            <tr>
              <td class="email-hero" style="background:#0b1020;border-radius:12px 12px 0 0;padding:28px 32px 24px;">
                <p style="margin:0 0 10px;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#4a7bff;">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4a7bff;vertical-align:middle;margin-right:8px;"></span>
                  Newsletter
                </p>
                <h1 class="email-headline" style="margin:0;font-size:28px;line-height:1.1;font-weight:800;letter-spacing:-0.8px;color:#f5f5f3;">Jste přihlášeni.</h1>
              </td>
            </tr>
            <tr>
              <td class="email-body" style="background:#ffffff;border:1px solid rgba(11,16,32,0.08);border-top:none;border-radius:0 0 12px 12px;padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;font-weight:600;color:#0b1020;">Ahoj,</p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;">Děkujeme za přihlášení k newsletteru CTRL Europe. Napíšeme, až bude něco nového ve skupinách, které jste zvolili.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;width:100%;">
                  <tr>
                    <td class="email-summary" style="background:#eff4ff;border:1px solid rgba(29,78,216,0.14);border-left:3px solid #1d4ed8;border-radius:8px;padding:20px 22px;">
                      <h2 style="margin:0 0 14px;font-size:13px;line-height:1.4;font-weight:700;color:#0b1020;">Váš odběr</h2>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                        <tr>
                          <td class="email-row-label" style="padding:10px 0;border-bottom:1px solid rgba(29,78,216,0.12);font-family:Geist Mono,Consolas,monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:#1d4ed8;vertical-align:top;width:42%;">Skupiny</td>
                          <td class="email-row-value" style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(29,78,216,0.12);font-size:14px;line-height:1.5;color:#0b1020;font-weight:500;">Aktuality</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#0b1020;">Skupiny můžete změnit opětovným odesláním formuláře, nebo se odhlásit tlačítkem níže.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="width:auto;">
                  <tr>
                    <td class="email-cta-cell" style="border-radius:8px;background:#0b1020;">
                      <a class="email-cta-link" href="https://ctrleurope.com" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#f5f5f3;text-decoration:none;">Navštívit web &rarr;</a>
                    </td>
                    <td class="email-cta-cell" style="padding-left:10px;">
                      <a class="email-cta-link" href="{{unsubscribe_url}}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#0b1020;text-decoration:none;border:1px solid rgba(11,16,32,0.18);border-radius:8px;">Odhlásit odběr &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 12px 0;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6b7280;">Budujeme digitální odolnost pro novou evropskou generaci.</p>
                <p style="margin:0;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">CTRL Europe · <a href="https://ctrleurope.com" style="color:#4a7bff;text-decoration:none;">ctrleurope.com</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

const UNSUBSCRIBE_LINK = '<a href="{{unsubscribe_url}}">Odhlásit odběr</a>'

const inputCls = 'w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]'

const tabCls = (active) =>
  `py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer border-b-2 -mb-px transition-all duration-200 shrink-0 ${
    active ? 'text-ctrl-accent border-ctrl-accent' : 'text-ctrl-text2 border-transparent hover:text-ctrl-text'
  }`

const primaryBtnCls = 'border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed'

const dangerBtnCls = 'border border-ctrl-danger py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent text-ctrl-danger hover:bg-[rgba(255,51,102,0.08)] disabled:opacity-50 disabled:cursor-not-allowed'

function restorePlaceholder(html) {
  return String(html)
    .replaceAll('&#123;&#123;unsubscribe_url&#125;&#125;', '{{unsubscribe_url}}')
    .replaceAll('%7B%7Bunsubscribe_url%7D%7D', '{{unsubscribe_url}}')
    .replaceAll('%7b%7bunsubscribe_url%7d%7d', '{{unsubscribe_url}}')
}

function renderedHasMarker(rendered, marker) {
  if (rendered.includes(marker)) return true
  if (marker === '{{unsubscribe_url}}') {
    const restored = restorePlaceholder(rendered)
    return restored.includes('{{unsubscribe_url}}')
  }
  return false
}

function hasDarkHeader(rendered) {
  const value = rendered.toLowerCase().replace(/\s+/g, '')
  return value.includes('#0b1020') || value.includes('rgb(11,16,32)')
}

function hasBlueBox(rendered) {
  const value = rendered.toLowerCase().replace(/\s+/g, '')
  return value.includes('#eff4ff') || value.includes('rgb(239,244,255)')
}

export function visualKeepsSource(source, rendered) {
  if (!rendered || !rendered.trim()) return false
  const checks = ['ctrl_logo_bez_pozadi.png', 'Jste přihlášeni.', '{{unsubscribe_url}}', 'Odhlásit odběr']
  for (const marker of checks) {
    if (source.includes(marker) && !renderedHasMarker(rendered, marker)) return false
  }
  if (source.toLowerCase().includes('#0b1020') && !hasDarkHeader(rendered)) return false
  if (source.toLowerCase().includes('#eff4ff') && !hasBlueBox(rendered)) return false
  return true
}

function editorSurface(editor) {
  try {
    return `${editor.getHtml()}\n${editor.getCss()}`
  } catch {
    return ''
  }
}

function loadIntoEditor(editor, html) {
  const apply = (markup, css) => {
    editor.Components.clear()
    editor.Css.clear()
    if (css) editor.setStyle(css)
    editor.setComponents(markup)
    return visualKeepsSource(html, editorSurface(editor))
  }

  try {
    if (apply(html, '')) return true
  } catch {
    return false
  }

  try {
    const parsed = new DOMParser().parseFromString(html, 'text/html')
    const body = parsed.body?.innerHTML || ''
    if (!body.trim()) return false
    const css = [...parsed.querySelectorAll('style')].map((node) => node.textContent || '').join('\n')
    return apply(body, css)
  } catch {
    return false
  }
}

function inlinedHtml(editor) {
  try {
    const result = editor.runCommand('gjs-get-inlined-html')
    if (typeof result === 'string' && result.trim()) return restorePlaceholder(result)
  } catch {
    /* zdroj zůstane, jak je */
  }
  return ''
}

const presetPlugin = newsletterPreset?.default || newsletterPreset

function filledIcon(path, evenodd) {
  const rule = evenodd ? ' fill-rule="evenodd"' : ''
  return `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor"${rule} d="${path}"/></svg>`
}

const TRASH_ICON = filledIcon('M9 3h6l1 1h4v2H4V4h4l1-1zm-1 5h8l-.7 13H8.7L8 8zm2.2 2h1.6v9h-1.6v-9zm3.2 0h1.6v9h-1.6v-9z', true)
const SETTINGS_ICON = filledIcon('M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z')

const ICON_TITLES = {
  'set-device-desktop': 'Počítač',
  'set-device-tablet': 'Tablet',
  'set-device-mobile': 'Telefon',
  'sw-visibility': 'Okraje prvků',
  'core:component-outline': 'Okraje prvků',
  preview: 'Náhled',
  fullscreen: 'Celá obrazovka',
  'export-template': 'Kód',
  'gjs-open-import-template': 'Vložit šablonu',
  'gjs-toggle-images': 'Obrázky',
  undo: 'Zpět',
  redo: 'Vpřed',
  'core:undo': 'Zpět',
  'core:redo': 'Vpřed',
  'canvas-clear': 'Vymazat plátno',
  'open-sm': 'Styl',
  'open-tm': 'Nastavení',
  'open-layers': 'Vrstvy',
  'open-blocks': 'Bloky',
  'insert-odhlaseni': 'Odhlášení',
}

const ENGLISH_TITLES = {
  'View components': 'Okraje prvků',
  Preview: 'Náhled',
  Fullscreen: 'Celá obrazovka',
  'View code': 'Kód',
  'Open Style Manager': 'Styl',
  Settings: 'Nastavení',
  'Open Layer Manager': 'Vrstvy',
  'Open Blocks': 'Bloky',
}

const BLOCK_LABELS = {
  sect100: 'Celá šířka',
  sect50: 'Dva sloupce',
  sect30: 'Tři sloupce',
  sect37: 'Úzký a široký',
  button: 'Tlačítko',
  divider: 'Oddělovač',
  text: 'Text',
  'text-sect': 'Odstavec',
  image: 'Obrázek',
  quote: 'Citace',
  link: 'Odkaz',
  'link-block': 'Blok odkazu',
  'grid-items': 'Karty',
  'list-items': 'Seznam',
}

const SECTOR_NAMES = {
  Dimension: 'Rozměry',
  Typography: 'Písmo',
  Decorations: 'Barvy',
}

const PROP_BY_CSS = {
  width: 'Šířka',
  height: 'Výška',
  'max-width': 'Nejširší',
  'min-height': 'Nejnižší',
  margin: 'Vnější mezera',
  padding: 'Vnitřní mezera',
  'margin-top': 'Nahoře',
  'margin-right': 'Vpravo',
  'margin-bottom': 'Dole',
  'margin-left': 'Vlevo',
  'padding-top': 'Nahoře',
  'padding-right': 'Vpravo',
  'padding-bottom': 'Dole',
  'padding-left': 'Vlevo',
  'font-family': 'Písmo',
  'font-size': 'Velikost',
  'font-weight': 'Tučnost',
  'letter-spacing': 'Rozestup',
  color: 'Barva textu',
  'line-height': 'Řádkování',
  'text-align': 'Zarovnání',
  'text-decoration': 'Podtržení',
  'font-style': 'Řez písma',
  'vertical-align': 'Svisle',
  'text-shadow': 'Stín textu',
  'background-color': 'Barva pozadí',
  'border-collapse': 'Slepit rámeček',
  'border-radius': 'Zaoblení',
  border: 'Rámeček',
  background: 'Pozadí',
  'border-width': 'Tloušťka',
  'border-style': 'Typ čáry',
  'border-color': 'Barva rámečku',
  'background-image': 'Obrázek',
  'background-repeat': 'Opakování',
  'background-position': 'Pozice',
  'background-attachment': 'Ukotvení',
  'background-size': 'Velikost',
  'border-top-left-radius': 'Levý horní',
  'border-top-right-radius': 'Pravý horní',
  'border-bottom-left-radius': 'Levý dolní',
  'border-bottom-right-radius': 'Pravý dolní',
}

const PROP_BY_LABEL = {
  Font: 'Písmo',
  Weight: 'Tučnost',
  'Font color': 'Barva textu',
  Top: 'Nahoře',
  Right: 'Vpravo',
  Bottom: 'Dole',
  Left: 'Vlevo',
  Background: 'Pozadí',
  Width: 'Tloušťka',
  Style: 'Typ čáry',
  Color: 'Barva',
  Image: 'Obrázek',
  Repeat: 'Opakování',
  Position: 'Pozice',
  Attachment: 'Ukotvení',
  Size: 'Velikost',
}

const OPTION_NAMES = {
  Left: 'Vlevo',
  Center: 'Na střed',
  Right: 'Vpravo',
  Justify: 'Do bloku',
  None: 'Žádné',
  underline: 'Podtržené',
  'Line-through': 'Přeškrtnuté',
  Normal: 'Normální',
  Italic: 'Kurzíva',
  No: 'Ne',
  Yes: 'Ano',
  left: 'Vlevo',
  center: 'Na střed',
  right: 'Vpravo',
  justify: 'Do bloku',
  none: 'Žádné',
  'line-through': 'Přeškrtnuté',
  normal: 'Normální',
  italic: 'Kurzíva',
  baseline: 'Na řádku',
  top: 'Nahoru',
  middle: 'Na střed',
  bottom: 'Dolů',
  separate: 'Ne',
  collapse: 'Ano',
}

function translateStyleProps(props) {
  if (!props || typeof props.forEach !== 'function') return
  props.forEach((prop) => {
    const css = String(prop.get('property') || '')
    const label = String(prop.get('name') || '')
    const next = PROP_BY_CSS[css] || PROP_BY_LABEL[label]
    if (next) prop.set('name', next)
    translateStyleProps(prop.get('properties'))
    const list = prop.get('list')
    if (!list || typeof list.forEach !== 'function') return
    list.forEach((item) => {
      if (!item.get || !item.set) return
      const name = item.get('name')
      const value = String(item.get('value') ?? '')
      const translated = OPTION_NAMES[name] || (!name && OPTION_NAMES[value])
      if (translated) item.set('name', translated)
    })
  })
}

function adaptEditorForUsers(editor) {
  try {
    Object.entries(BLOCK_LABELS).forEach(([id, label]) => {
      const block = editor.BlockManager.get(id)
      if (block) block.set('label', label)
    })

    editor.StyleManager.getSectors().forEach((sector) => {
      const next = SECTOR_NAMES[sector.get('name')]
      if (next) sector.set('name', next)
      if (sector.get('name') === 'Písmo') sector.set('open', true)
      translateStyleProps(sector.get('properties'))
      sector.view?.render?.()
    })

    document.querySelectorAll('.newsletter-visual .gjs-radio-item').forEach((item) => {
      const label = item.querySelector('label')
      const input = item.querySelector('input')
      if (!label || !input) return
      const next = OPTION_NAMES[label.textContent.trim()] || OPTION_NAMES[input.value]
      if (!next) return
      label.textContent = next
      label.classList.remove('fa', 'fa-times', 'fa-underline', 'fa-strikethrough', 'fa-font', 'fa-italic', 'fa-align-left', 'fa-align-center', 'fa-align-right', 'fa-align-justify')
    })

    const selectNames = {
      100: 'Tenké',
      200: 'Velmi lehké',
      300: 'Lehké',
      400: 'Normální',
      500: 'Střední',
      600: 'Polotučné',
      700: 'Tučné',
      800: 'Velmi tučné',
      900: 'Nejsilnější',
      none: 'Žádná',
      solid: 'Plná',
      dotted: 'Tečkovaná',
      dashed: 'Čárkovaná',
      double: 'Dvojitá',
      groove: 'Prohloubená',
      ridge: 'Vystouplá',
      inset: 'Dovnitř',
      outset: 'Ven',
    }
    document.querySelectorAll('.newsletter-visual select option').forEach((option) => {
      const next = selectNames[option.value]
      if (next) option.textContent = next
    })
  } catch {
    /* popisky nejsou důvod shodit editor */
  }
}

const CANVAS_ICON_CSS = `
  .gjs-toolbar { background: #12182b; border-radius: 8px; padding: 4px; box-shadow: 0 8px 20px rgba(0,0,0,.28); }
  .gjs-toolbar-item { width: 36px; height: 34px; padding: 7px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; }
  .gjs-toolbar-item svg { width: 20px; height: 20px; display: block; }
  .gjs-toolbar-item:hover { background: rgba(255,255,255,.14); }
  .gjs-toolbar-item:last-child { color: #ff5c7a; }
`

function polishEditorIcons(editor) {
  const icons = editor.getConfig?.().icons
  if (icons) icons.delete = TRASH_ICON

  editor.Panels.getPanels().forEach((panel) => {
    const buttons = panel.get('buttons')
    const empty = []
    buttons.forEach((button) => {
      const id = button.get('id')
      const command = button.get('command')
      const label = button.get('label')
      if (!id && !command && !label) empty.push(button)
    })
    empty.forEach((button) => buttons.remove(button))

    buttons.forEach((button) => {
      const id = String(button.get('id') || '')
      const command = button.get('command')
      const commandId = typeof command === 'string' ? command : ''
      const attrs = { ...(button.get('attributes') || {}) }
      const title = ICON_TITLES[commandId] || ICON_TITLES[id] || ENGLISH_TITLES[attrs.title]
      if (title) attrs.title = title
      if (title) button.set('attributes', attrs)
      const key = `${commandId} ${id} ${title || ''}`
      if (key.includes('canvas-clear') || title === 'Vymazat plátno') button.set('label', TRASH_ICON)
      if (key.includes('open-tm') || attrs.title === 'Settings' || title === 'Nastavení') button.set('label', SETTINGS_ICON)
    })
  })

  const retitle = () => {
    document.querySelectorAll('.newsletter-visual .gjs-pn-btn').forEach((el) => {
      const current = el.getAttribute('title') || ''
      const next = ENGLISH_TITLES[current]
      if (next) el.setAttribute('title', next)
      if (el.getAttribute('title') === 'Vymazat plátno') el.classList.add('is-danger')
    })
  }
  editor.on('load', retitle)
  window.setTimeout(retitle, 50)

  const nameToolbar = () => {
    const items = [...document.querySelectorAll('.newsletter-visual .gjs-toolbar-item')]
    const fromEnd = ['Smazat', 'Kopírovat', 'Posunout', 'Nadřazený prvek']
    items.reverse().forEach((item, index) => {
      if (fromEnd[index]) item.setAttribute('title', fromEnd[index])
    })
  }
  editor.on('component:selected', () => window.setTimeout(nameToolbar, 0))
  adaptEditorForUsers(editor)
  editor.on('load', () => adaptEditorForUsers(editor))
}

export const NewsletterTemplateEditor = forwardRef(function NewsletterTemplateEditor({
  name: initialName,
  subject: initialSubject,
  html: initialHtml,
  canDelete,
  saving,
  compose = false,
  onDirtyChange,
  onSave,
  onDelete,
}, ref) {
  const [name, setName] = useState(initialName)
  const [subject, setSubject] = useState(initialSubject)
  const [html, setHtml] = useState(initialHtml)
  const [mode, setMode] = useState('visual')
  const [importError, setImportError] = useState(false)
  const hostRef = useRef(null)
  const editorRef = useRef(null)
  const htmlRef = useRef(initialHtml)
  const nameRef = useRef(initialName)
  const subjectRef = useRef(initialSubject)
  const modeRef = useRef('visual')
  const editedHtmlRef = useRef(false)
  const dirtyRef = useRef(false)
  const onDirtyChangeRef = useRef(onDirtyChange)
  const initialRef = useRef({ name: initialName, subject: initialSubject, html: initialHtml })
  const readyRef = useRef(false)

  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange
  }, [onDirtyChange])

  const publishDirty = (nextName, nextSubject) => {
    const dirty = nextName !== initialRef.current.name
      || nextSubject !== initialRef.current.subject
      || editedHtmlRef.current
    dirtyRef.current = dirty
    onDirtyChangeRef.current?.(dirty)
  }

  const markHtmlEdited = () => {
    editedHtmlRef.current = true
    publishDirty(nameRef.current, subjectRef.current)
  }

  const currentHtml = () => {
    if (modeRef.current === 'visual' && editorRef.current) {
      const inlined = inlinedHtml(editorRef.current)
      if (inlined) return inlined
    }
    return htmlRef.current
  }

  useImperativeHandle(ref, () => ({
    isDirty: () => dirtyRef.current,
    getSnapshot: () => ({
      name: nameRef.current,
      subject: subjectRef.current,
      html: currentHtml(),
    }),
    reset: () => {
      const initial = initialRef.current
      nameRef.current = initial.name
      subjectRef.current = initial.subject
      htmlRef.current = initial.html
      editedHtmlRef.current = false
      setName(initial.name)
      setSubject(initial.subject)
      setHtml(initial.html)
      setImportError(false)
      publishDirty(initial.name, initial.subject)
      if (modeRef.current === 'visual' && editorRef.current) {
        readyRef.current = false
        const ok = loadIntoEditor(editorRef.current, initial.html)
        readyRef.current = true
        if (!ok) {
          setImportError(true)
          modeRef.current = 'html'
          setMode('html')
        }
        return
      }
      modeRef.current = 'visual'
      setMode('visual')
    },
  }))

  useEffect(() => {
    if (mode !== 'visual') return undefined
    const host = hostRef.current
    if (!host) return undefined

    let editor
    try {
      editor = grapesjs.init({
        container: host,
        height: '720px',
        width: 'auto',
        storageManager: false,
        noticeOnUnload: false,
        fromElement: false,
        plugins: [presetPlugin],
        canvasCss: CANVAS_ICON_CSS,
        i18n: {
          locale: 'cs',
          localeFallback: 'en',
          detectLocale: false,
          messages: {
            cs: {
              domComponents: {
                names: {
                  '': 'Blok',
                  wrapper: 'Mail',
                  text: 'Text',
                  image: 'Obrázek',
                  video: 'Video',
                  label: 'Popisek',
                  link: 'Odkaz',
                  table: 'Tabulka',
                  row: 'Řádek',
                  cell: 'Buňka',
                  tbody: 'Tělo tabulky',
                  thead: 'Hlavička tabulky',
                  tfoot: 'Patička tabulky',
                },
              },
              blockManager: {
                labels: {
                  sect100: 'Celá šířka',
                  sect50: 'Dva sloupce',
                  sect30: 'Tři sloupce',
                  sect37: 'Úzký a široký',
                  button: 'Tlačítko',
                  divider: 'Oddělovač',
                  text: 'Text',
                  'text-sect': 'Odstavec',
                  image: 'Obrázek',
                  quote: 'Citace',
                  link: 'Odkaz',
                  'link-block': 'Blok odkazu',
                  'grid-items': 'Karty',
                  'list-items': 'Seznam',
                  odhlaseni: 'Odhlášení',
                },
              },
              panels: {
                buttons: {
                  titles: {
                    preview: 'Náhled',
                    fullscreen: 'Celá obrazovka',
                    'sw-visibility': 'Okraje prvků',
                    'export-template': 'Kód',
                    'open-sm': 'Styl',
                    'open-tm': 'Nastavení',
                    'open-layers': 'Vrstvy',
                    'open-blocks': 'Bloky',
                  },
                },
              },
              selectorManager: {
                label: 'Třídy',
                selected: 'Vybrané',
                emptyState: 'Stav',
                states: {
                  hover: 'Najetí myší',
                  active: 'Kliknutí',
                  'nth-of-type(2n)': 'Sudé a liché',
                },
              },
              styleManager: {
                empty: 'Klikni na text, tlačítko nebo obrázek.',
                layer: 'Vrstva',
                fileButton: 'Obrázky',
                sectors: {
                  dimension: 'Rozměry',
                  typography: 'Písmo',
                  decorations: 'Barvy',
                },
                options: {
                  'text-align': {
                    left: 'Vlevo',
                    center: 'Na střed',
                    right: 'Vpravo',
                    justify: 'Do bloku',
                  },
                  'text-decoration': {
                    none: 'Žádné',
                    underline: 'Podtržené',
                    'line-through': 'Přeškrtnuté',
                  },
                  'font-style': {
                    normal: 'Normální',
                    italic: 'Kurzíva',
                  },
                  'vertical-align': {
                    baseline: 'Na řádku',
                    top: 'Nahoru',
                    middle: 'Na střed',
                    bottom: 'Dolů',
                  },
                  'border-collapse': {
                    separate: 'Ne',
                    collapse: 'Ano',
                  },
                  'font-weight': {
                    100: 'Tenké',
                    200: 'Velmi lehké',
                    300: 'Lehké',
                    400: 'Normální',
                    500: 'Střední',
                    600: 'Polotučné',
                    700: 'Tučné',
                    800: 'Velmi tučné',
                    900: 'Nejsilnější',
                  },
                  'border-style': {
                    none: 'Žádná',
                    solid: 'Plná',
                    dotted: 'Tečkovaná',
                    dashed: 'Čárkovaná',
                    double: 'Dvojitá',
                    groove: 'Prohloubená',
                    ridge: 'Vystouplá',
                    inset: 'Dovnitř',
                    outset: 'Ven',
                  },
                },
                properties: {
                  'margin-top-sub': 'Nahoře',
                  'margin-right-sub': 'Vpravo',
                  'margin-bottom-sub': 'Dole',
                  'margin-left-sub': 'Vlevo',
                  'padding-top-sub': 'Nahoře',
                  'padding-right-sub': 'Vpravo',
                  'padding-bottom-sub': 'Dole',
                  'padding-left-sub': 'Vlevo',
                  'border-width-sub': 'Tloušťka',
                  'border-style-sub': 'Typ čáry',
                  'border-color-sub': 'Barva',
                  'border-top-left-radius-sub': 'Levý horní',
                  'border-top-right-radius-sub': 'Pravý horní',
                  'border-bottom-right-radius-sub': 'Pravý dolní',
                  'border-bottom-left-radius-sub': 'Levý dolní',
                  'background-image-sub': 'Obrázek',
                  'background-repeat-sub': 'Opakování',
                  'background-position-sub': 'Pozice',
                  'background-attachment-sub': 'Ukotvení',
                  'background-size-sub': 'Velikost',
                  'text-shadow-h': 'Vodorovně',
                  'text-shadow-v': 'Svisle',
                  'text-shadow-blur': 'Rozmazání',
                  'text-shadow-color': 'Barva',
                },
              },
              traitManager: {
                empty: 'Klikni na část mailu.',
                label: 'Podrobnosti',
                traits: {
                  labels: {
                    id: 'Id',
                    alt: 'Popis obrázku',
                    title: 'Titulek',
                    href: 'Adresa odkazu',
                    target: 'Otevřít',
                    src: 'Adresa obrázku',
                  },
                  attributes: {
                    href: { placeholder: 'https://…' },
                    alt: { placeholder: 'Co je na obrázku' },
                    src: { placeholder: 'https://…' },
                  },
                  options: {
                    target: {
                      false: 'Ve stejném okně',
                      _blank: 'V novém okně',
                    },
                  },
                },
              },
            },
          },
        },
      })
    } catch {
      setImportError(true)
      modeRef.current = 'html'
      setMode('html')
      return undefined
    }

    editorRef.current = editor
    editor.BlockManager.add('odhlaseni', {
      label: 'Odhlášení',
      content: UNSUBSCRIBE_LINK,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.6 13.4a1 1 0 0 1 0-1.4l2.8-2.8a3 3 0 0 1 4.2 4.2l-1.4 1.4a1 1 0 1 1-1.4-1.4l1.4-1.4a1 1 0 0 0-1.4-1.4l-2.8 2.8a1 1 0 0 1-1.4 0Zm2.8-2.8a1 1 0 0 1 0 1.4l-2.8 2.8a3 3 0 0 1-4.2-4.2l1.4-1.4a1 1 0 1 1 1.4 1.4L7.8 12a1 1 0 1 0 1.4 1.4l2.8-2.8a1 1 0 0 1 1.4 0Z"/></svg>',
    })
    editor.Commands.add('insert-odhlaseni', {
      run(ed) {
        ed.addComponents(UNSUBSCRIBE_LINK)
      },
    })
    editor.Panels.addButton('options', [{
      id: 'odhlaseni',
      label: 'Odhlášení',
      command: 'insert-odhlaseni',
      attributes: { title: 'Odhlášení' },
    }])
    polishEditorIcons(editor)

    readyRef.current = false
    let ok = false
    try {
      ok = loadIntoEditor(editor, htmlRef.current)
    } catch {
      ok = false
    }

    if (!ok) {
      editor.destroy()
      editorRef.current = null
      host.innerHTML = ''
      setImportError(true)
      modeRef.current = 'html'
      setMode('html')
      return undefined
    }

    setImportError(false)
    let baseline = editorSurface(editor)
    const onEdit = () => {
      if (!readyRef.current) return
      if (editorSurface(editor) === baseline) return
      markHtmlEdited()
    }
    editor.on('update', onEdit)
    const arm = window.setTimeout(() => {
      baseline = editorSurface(editor)
      readyRef.current = true
    }, 400)

    return () => {
      window.clearTimeout(arm)
      readyRef.current = false
      editor.destroy()
      editorRef.current = null
      host.innerHTML = ''
    }
  }, [mode])

  const switchToHtml = () => {
    if (modeRef.current === 'html') return
    const editor = editorRef.current
    if (editor) {
      const inlined = inlinedHtml(editor)
      if (inlined) {
        htmlRef.current = inlined
        setHtml(inlined)
      }
    }
    modeRef.current = 'html'
    setMode('html')
  }

  const switchToVisual = () => {
    if (modeRef.current === 'visual') return
    setImportError(false)
    modeRef.current = 'visual'
    setMode('visual')
  }

  return (
    <div className="bg-ctrl-panel border border-ctrl-border p-5 max-[900px]:p-3.5">
      <p className="text-sm text-ctrl-text2 mb-4">
        {compose
          ? 'Tady skládáš mail, který odejde. Šablona ho jen předvyplní, poslat jde i bez ní.'
          : 'Tady se ukládá vzhled. Při odeslání ho můžeš použít jako výchozí, není to povinné.'}
        {mode === 'visual' && ' Klikni do textu a přepiš ho. Vpravo jsou rozměry, písmo a barvy. Červený koš smaže označený kus.'}
      </p>
      <div className={`grid gap-3 mb-4 ${compose ? '' : 'max-[900px]:grid-cols-1 sm:grid-cols-2'}`}>
        {!compose && (
          <label className="block">
            <span className="block font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Název</span>
            <input
              className={inputCls}
              value={name}
              maxLength={80}
              onChange={(event) => {
                const value = event.target.value
                nameRef.current = value
                setName(value)
                publishDirty(value, subjectRef.current)
              }}
            />
          </label>
        )}
        <label className="block">
          <span className="block font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">Předmět</span>
          <input
            className={inputCls}
            value={subject}
            maxLength={120}
            onChange={(event) => {
              const value = event.target.value
              subjectRef.current = value
              setSubject(value)
              publishDirty(nameRef.current, value)
            }}
          />
        </label>
      </div>

      <div className="flex gap-0 mb-4 border-b border-ctrl-border">
        <button type="button" className={tabCls(mode === 'visual')} onClick={switchToVisual}>Vzhled</button>
        <button type="button" className={tabCls(mode === 'html')} onClick={switchToHtml}>HTML</button>
      </div>

      {importError && (
        <p className="mb-3 text-sm text-ctrl-danger">Tohle HTML se nepodařilo otevřít ve vzhledu. Uprav zdroj, nebo ho vrať.</p>
      )}

      {mode === 'visual' ? (
        <div ref={hostRef} className="newsletter-visual min-h-[720px] border border-ctrl-border bg-white" />
      ) : (
        <>
        <p className="mb-3 text-sm text-ctrl-text2">Zdroj mailu. Běžné úpravy jdou ve Vzhledu, sem jen když potřebuješ kód.</p>
        <textarea
          className={`${inputCls} font-mono text-[12px] leading-5 min-h-[480px] whitespace-pre overflow-auto`}
          value={html}
          spellCheck={false}
          onChange={(event) => {
            const value = event.target.value
            htmlRef.current = value
            setHtml(value)
            if (value !== initialRef.current.html) markHtmlEdited()
            else {
              editedHtmlRef.current = false
              publishDirty(nameRef.current, subjectRef.current)
            }
          }}
        />
        </>
      )}

      {!compose && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            className={primaryBtnCls}
            disabled={saving}
            onClick={() => onSave?.({
              name: nameRef.current,
              subject: subjectRef.current,
              html: currentHtml(),
            })}
          >
            Uložit
          </button>
          {canDelete && (
            <button type="button" className={dangerBtnCls} disabled={saving} onClick={onDelete}>
              Smazat
            </button>
          )}
        </div>
      )}
    </div>
  )
})
