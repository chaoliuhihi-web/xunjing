import fs from 'fs'
import path from 'path'

const repoRoot = process.cwd()
const logoUrl = 'https://www.neoxiake.com//upload/admin/20260602/d307da0de58c7b5ab10dc6abf35797da.png'

const videoPages = [
  {
    path: 'subPackages/feature/shortPlays/shortPlays.vue',
    tag: 'cover-image',
    top: '64rpx',
    width: '96rpx',
    height: '58rpx'
  },
  {
    path: 'subPackages/feature/theater/theaterDetail.vue',
    tag: 'cover-image',
    top: 'calc(50% - 210rpx + 24rpx)',
    width: '120rpx',
    height: '72rpx'
  }
]

for (const pageConfig of videoPages) {
  const page = pageConfig.path
  const source = fs.readFileSync(path.join(repoRoot, page), 'utf8')

  if (!source.includes(`const VIDEO_LOGO_URL = '${logoUrl}'`)) {
    throw new Error(`${page} should define the shared video logo URL`)
  }

  if (!source.includes(`<${pageConfig.tag} class="video-logo"`) || !source.includes(':src="VIDEO_LOGO_URL"')) {
    throw new Error(`${page} should render the video logo with ${pageConfig.tag}`)
  }

  if (!source.includes('class="video-logo"')) {
    throw new Error(`${page} should assign the video-logo class to the overlay`)
  }

  const escapedTop = pageConfig.top.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const logoStylePattern = new RegExp(
    `\\.video-logo\\s*\\{[\\s\\S]*position:\\s*absolute;[\\s\\S]*top:\\s*${escapedTop};[\\s\\S]*left:\\s*24rpx;[\\s\\S]*z-index:\\s*20;[\\s\\S]*width:\\s*${pageConfig.width};[\\s\\S]*height:\\s*${pageConfig.height};`
  )

  if (!logoStylePattern.test(source)) {
    throw new Error(`${page} should position and size the logo correctly`)
  }
}

console.log('Video logo overlay regression passed.')
