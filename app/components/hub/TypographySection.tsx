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
      <p className="text-[14px] text-[#8a8a85] mb-8">
        {editing
          ? 'Edit typefaces, weights, and specimens. Google Fonts load automatically by name.'
          : 'Our type system — font families, weights, and usage guidelines.'}
      </p>

      {config.typography.map((group, gi) => (
        <div key={gi} className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-6">
            <Editable
              inline
              value={group.group}
              placeholder="Group name"
              onChange={v => update(c => { c.typography[gi].group = v })}
            />
          </p>

          {group.fonts.map((font, fi) => (
            <div key={fi} className="bg-white border border-[#e8e7e4] rounded-2xl p-6 mb-6 group/font">
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
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
                  <p className="text-[13px] text-[#8a8a85]">
                    <Editable inline value={font.role} placeholder="Role" onChange={v => update(c => { c.typography[gi].fonts[fi].role = v })} />
                    {' · '}
                    <Editable inline value={font.usage} placeholder="Usage" onChange={v => update(c => { c.typography[gi].fonts[fi].usage = v })} />
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(editing ? ALL_WEIGHTS : font.weights).map(w => {
                    const active = font.weights.includes(w)
                    if (!editing) {
                      return <span key={w} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f0efec] text-[#8a8a85]">{w}</span>
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
                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                            : 'bg-white text-[#b0afa9] border-[#e8e7e4] hover:border-[#b0afa9]'
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
                      className="ml-2 text-[#b0afa9] hover:text-red-500 opacity-0 group-hover/font:opacity-100 transition-all"
                      title="Delete font"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-[#f0efec] pt-4">
                {font.specimens.map((spec, si) => (
                  <div key={si} className="flex items-baseline gap-4 group/spec">
                    <span className="text-[11px] text-[#b0afa9] w-16 shrink-0">
                      <Editable inline value={spec.label} placeholder="Label" onChange={v => update(c => { c.typography[gi].fonts[fi].specimens[si].label = v })} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Editable
                        value={spec.sample}
                        placeholder="Specimen text"
                        onChange={v => update(c => { c.typography[gi].fonts[fi].specimens[si].sample = v })}
                        className="text-[#1a1a1a] leading-tight"
                        style={{ fontFamily: `'${font.name}', sans-serif`, fontSize: spec.size, fontWeight: Number(spec.weight) || 400, lineHeight: 1.2 }}
                      />
                      {editing && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            value={spec.size}
                            onChange={e => update(c => { c.typography[gi].fonts[fi].specimens[si].size = e.target.value })}
                            className="w-16 text-[11px] font-mono px-1.5 py-0.5 border border-[#e8e7e4] rounded outline-none focus:border-[#1a1a1a]"
                            title="Size (e.g. 24px)"
                          />
                          <select
                            value={spec.weight}
                            onChange={e => update(c => { c.typography[gi].fonts[fi].specimens[si].weight = e.target.value })}
                            className="text-[11px] font-mono px-1 py-0.5 border border-[#e8e7e4] rounded outline-none bg-white"
                            title="Weight"
                          >
                            {ALL_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                          <button
                            onClick={() => update(c => { c.typography[gi].fonts[fi].specimens.splice(si, 1) })}
                            className="text-[#b0afa9] hover:text-red-500 opacity-0 group-hover/spec:opacity-100 transition-all"
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
                    className="text-[12px] text-[#8a8a85] hover:text-[#1a1a1a] flex items-center gap-1.5 transition-colors"
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
              className="text-[13px] font-medium text-[#8a8a85] hover:text-[#1a1a1a] border border-dashed border-[#dddcd6] hover:border-[#1a1a1a] rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors"
            >
              <Icon name="plus" size={13} /> Add typeface
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
