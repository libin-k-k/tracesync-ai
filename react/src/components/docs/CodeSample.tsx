import { useRef, useState } from 'react'
import { codeLanguages, type CodeLanguage } from '../../data/docsTutorial'

type CodeSampleProps = {
  samples: Record<CodeLanguage, string>
  label?: string
}

export function CodeSample({ samples, label = 'Request sample' }: CodeSampleProps) {
  const [language, setLanguage] = useState<CodeLanguage>('curl')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const tabRefs = useRef<Partial<Record<CodeLanguage, HTMLButtonElement | null>>>({})
  const activeIndex = codeLanguages.findIndex((item) => item.id === language)

  const copySample = async () => {
    try {
      await navigator.clipboard.writeText(samples[language])
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }

    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  const moveTab = (direction: 1 | -1) => {
    const next = (activeIndex + direction + codeLanguages.length) % codeLanguages.length
    const nextLanguage = codeLanguages[next].id
    setLanguage(nextLanguage)
    setCopyState('idle')
    tabRefs.current[nextLanguage]?.focus()
  }

  const copyLabel =
    copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy'

  return (
    <div className="docs-code">
      <div className="docs-code-bar">
        <div
          className="docs-tabs"
          role="tablist"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              moveTab(1)
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              moveTab(-1)
            }
          }}
        >
          {codeLanguages.map((item) => {
            const selected = item.id === language

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`docs-tab-${item.id}`}
                className={selected ? 'docs-tab is-active' : 'docs-tab'}
                aria-selected={selected}
                aria-controls="docs-code-panel"
                tabIndex={selected ? 0 : -1}
                ref={(node) => {
                  tabRefs.current[item.id] = node
                }}
                onClick={() => {
                  setLanguage(item.id)
                  setCopyState('idle')
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <button type="button" className="btn btn-ghost btn-compact" onClick={() => void copySample()}>
          {copyLabel}
        </button>
      </div>
      <pre
        id="docs-code-panel"
        role="tabpanel"
        aria-labelledby={`docs-tab-${language}`}
        className="docs-pre"
      >
        <code>{samples[language]}</code>
      </pre>
    </div>
  )
}
