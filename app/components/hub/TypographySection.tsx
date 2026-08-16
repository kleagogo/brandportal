'use client'

import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'

const ALL_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900']

function googleFontUrl(name: string, weights: string[]): string {
  const family = name.trim().replace(/ /g, '+')
  const wght = [...weights].sort((a, b) => Number(a) - Number(b)).join(';')
  return `https://fonts.googleapis.com/css2?family=${family}${wght ? `:wght@${wght}` : ''}&display=swap`
}

export function TypographySection() {
  const { config, editing, update } = useHub()

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Typography</h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        {editing
          ? 'Edit typefaces, weights, and specimens. Google Fonts load automatically by name.'
          : 'Our type system — font families, weights, and usage guidelines.'}
      </p>

      {config.typography.map((group, gi) => (
        <div key={gi} className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">Font Family</p>

          {group.fonts.map((font, fi) => (
            <div key={fi} className="bg-card border border-border rounded-2xl p-6 mb-6 group/font">
              <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[18px] font-semibold mb-1" style={{ fontFamily: `'${font.name}', sans-serif` }}>
                    <Editable
                      inline
                      value={font.name}
                      placeholder="Font name"
                      onChange={v => update(c => {
                        const f = c.typography[gi].fonts[fi]
                        f.name = v
                        f.importUrl = googleFontUrl(v, f.weights)
                      })}
                    />
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    <Editable inline value={font.primaryLabel || font.role} placeholder="Role" onChange={v => update(c => { c.typography[gi].fonts[fi].primaryLabel = v })} />
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(editing ? ALL_WEIGHTS : font.weights).map(w => {
                    const active = font.weights.includes(w)
                    if (!editing) {
                      return <span key={w} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{w}</span>
                    }
                    return (
                      <button
                        key={w}
                        onClick={() => update(c => {
                          const f = c.typography[gi].fonts[fi]
                          f.weights = active ? f.weights.filter(x => x !== w) : [...f.weights, w].sort((a, b) => Number(a) - Number(b))
                          f.importUrl = googleFontUrl(f.name, f.weights)
                        })}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-foreground'
                            : 'bg-card text-muted-foreground/60 border-border hover:border-muted-foreground'
                        }`}
                        title={`Weight ${w}`}
                      >
                        {w}
                      </button>
                    )
                  })}
                  {editing && (
                    <button
                      onClick={() => {
                        if (!window.confirm(`Remove "${font.name}" from the type system?`)) return
                        update(c => { c.typography[gi].fonts.splice(fi, 1) })
                      }}
                      className="ml-2 text-muted-foreground/60 hover:text-destructive opacity-0 group-hover/font:opacity-100 transition-all"
                      title="Delete font"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              </div>

              {font.cssSnippet && (
                <div className="border-t border-border pt-4 mb-2">
                  <code className="block text-[12px] font-mono text-muted-foreground bg-background border border-border rounded-lg px-3 py-2">
                    <Editable inline value={font.cssSnippet} placeholder="font-family: …" onChange={v => update(c => { c.typography[gi].fonts[fi].cssSnippet = v })} />
                  </code>
                </div>
              )}

              {font.downloads && font.downloads.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-[12px] font-semibold text-foreground mb-2.5">Download font files</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {font.downloads.map((d, di) => (
                      <a
                        key={di}
                        href={d.file || '#'}
                        {...(d.file ? { download: true } : { onClick: (e: React.MouseEvent) => e.preventDefault() })}
                        className="flex items-center gap-2 text-[12px] text-foreground border border-border rounded-lg px-3 py-2 hover:border-foreground transition-colors"
                      >
                        <Icon name="download" size={12} /> {d.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-6 mb-3">Type Scale</p>
              <div className="space-y-3">
                {font.specimens.map((spec, si) => (
                  <div key={si} className="group/spec rounded-xl bg-background border border-border px-4 py-3.5">
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
                        <Editable inline value={spec.label} placeholder="Label" onChange={v => update(c => { c.typography[gi].fonts[fi].specimens[si].label = v })} />
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Weight {spec.weight}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{spec.size}</span>
                      {spec.kerning && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Kerning {spec.kerning}</span>}
                      {spec.lineHeight && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Line {spec.lineHeight}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Editable
                        value={spec.sample}
                        placeholder="Specimen text"
                        onChange={v => update(c => { c.typography[gi].fonts[fi].specimens[si].sample = v })}
                        className="text-foreground leading-tight"
                        style={{
                          fontFamily: `'${font.name}', sans-serif`,
                          fontSize: spec.size,
                          fontWeight: Number(spec.weight) || 400,
                          lineHeight: spec.lineHeight || 1.2,
                          letterSpacing: spec.kerning ? `${parseFloat(spec.kerning) / 100}em` : undefined,
                        }}
                      />
                      {editing && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            value={spec.size}
                            onChange={e => update(c => { c.typography[gi].fonts[fi].specimens[si].size = e.target.value })}
                            className="w-16 text-[11px] font-mono px-1.5 py-0.5 border border-border rounded outline-none focus:border-foreground"
                            title="Size (e.g. 24px)"
                          />
                          <select
                            value={spec.weight}
                            onChange={e => update(c => { c.typography[gi].fonts[fi].specimens[si].weight = e.target.value })}
                            className="text-[11px] font-mono px-1 py-0.5 border border-border rounded outline-none bg-card"
                            title="Weight"
                          >
                            {ALL_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                          <button
                            onClick={() => update(c => { c.typography[gi].fonts[fi].specimens.splice(si, 1) })}
                            className="text-muted-foreground/60 hover:text-destructive opacity-0 group-hover/spec:opacity-100 transition-all"
                            title="Remove specimen"
                          >
                            <Icon name="close" size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {editing && (
                  <button
                    onClick={() => update(c => {
                      c.typography[gi].fonts[fi].specimens.push({ label: 'Style', size: '18px', weight: '400', sample: 'The quick brown fox jumps over the lazy dog' })
                    })}
                    className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <Icon name="plus" size={11} /> Add specimen
                  </button>
                )}
              </div>
            </div>
          ))}

          {editing && (
            <button
              onClick={() => update(c => {
                c.typography[gi].fonts.push({
                  name: 'Inter',
                  role: 'New typeface',
                  weights: ['400', '600'],
                  usage: 'Describe where this font is used',
                  importUrl: googleFontUrl('Inter', ['400', '600']),
                  specimens: [{ label: 'Sample', size: '20px', weight: '400', sample: 'The quick brown fox jumps over the lazy dog' }],
                })
              })}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors"
            >
              <Icon name="plus" size={13} /> Add typeface
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
