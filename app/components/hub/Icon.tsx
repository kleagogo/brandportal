'use client'

import {
  RiAddLine, RiArrowDownSLine, RiMoreLine, RiArrowRightSLine, RiArrowUpSLine, RiBrushLine, RiChat3Line,
  RiCheckLine, RiCloseLine, RiContrastLine, RiDeleteBinLine, RiDownloadLine,
  RiFileCopyLine, RiFileLine, RiFontSansSerif, RiHeartLine, RiHistoryLine,
  RiHome5Line, RiImageLine, RiLayoutGridLine, RiLayoutLine, RiLinkM,
  RiListUnordered, RiMailLine, RiMenuLine, RiMoonLine, RiPencilLine,
  RiSearchLine, RiSendPlaneLine, RiSettings3Line, RiShareLine, RiSparklingLine,
  RiStackLine, RiSunLine, RiUploadLine, RiUserLine, RiVideoLine,
  type RemixiconComponentType,
} from '@remixicon/react'

/**
 * The icon set, mapped onto Remix icons — the library shadcn was initialised
 * with (see `iconLibrary` in components.json).
 *
 * These used to be hand-drawn SVGs. The names are kept exactly as they were,
 * because they're stored in hub data: every section carries an `icon` string,
 * so renaming any key here would blank the icon on existing hubs.
 */
const ICONS: Record<string, RemixiconComponentType> = {
  // Sections
  home: RiHome5Line,
  logo: RiLayoutGridLine,
  colors: RiContrastLine,
  type: RiFontSansSerif,
  screenshots: RiImageLine,
  artwork: RiBrushLine,
  video: RiVideoLine,
  guidelines: RiListUnordered,
  templates: RiLayoutLine,
  sparkles: RiSparklingLine,
  heart: RiHeartLine,
  mail: RiMailLine,
  person: RiUserLine,
  file: RiFileLine,
  link: RiLinkM,

  // Controls
  download: RiDownloadLine,
  upload: RiUploadLine,
  copy: RiFileCopyLine,
  share: RiShareLine,
  edit: RiPencilLine,
  check: RiCheckLine,
  close: RiCloseLine,
  plus: RiAddLine,
  trash: RiDeleteBinLine,
  up: RiArrowUpSLine,
  down: RiArrowDownSLine,
  menu: RiMenuLine,
  more: RiMoreLine,
  right: RiArrowRightSLine,
  search: RiSearchLine,
  gear: RiSettings3Line,
  history: RiHistoryLine,
  spaces: RiStackLine,
  chat: RiChat3Line,
  send: RiSendPlaneLine,
  sun: RiSunLine,
  moon: RiMoonLine,
}

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const Glyph = ICONS[name]
  if (!Glyph) return null
  // Remix icons are 24px by default and inherit currentColor.
  return <Glyph size={size} aria-hidden="true" />
}
