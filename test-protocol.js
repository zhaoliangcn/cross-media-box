const { open, stat, writeFile, unlink } = require('fs/promises')
const { join } = require('path')
const { tmpdir } = require('os')

const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wma': 'audio/x-ms-wma'
}

function getMimeType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return MIME_TYPES[`.${ext}`] || 'application/octet-stream'
}

function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader) return null
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
  if (!match) return null
  const start = parseInt(match[1], 10)
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
  if (start >= fileSize || end >= fileSize || start > end) return null
  return { start, end, length: end - start + 1 }
}

async function readFileRange(filePath, start, length) {
  const buffer = Buffer.alloc(length)
  const fd = await open(filePath, 'r')
  try {
    await fd.read(buffer, 0, length, start)
    return buffer
  } finally {
    await fd.close()
  }
}

async function readFullFile(filePath) {
  const fileStat = await stat(filePath)
  const fd = await open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(fileStat.size)
    await fd.read(buffer, 0, fileStat.size, 0)
    return buffer
  } finally {
    await fd.close()
  }
}

async function runTests() {
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      passed++
      console.log(`  ✓ ${message}`)
    } else {
      failed++
      console.error(`  ✗ ${message}`)
    }
  }

  console.log('\n=== 协议处理器 Range 请求测试 ===\n')

  // 1. 创建测试文件
  console.log('1. 创建测试文件')
  const testFilePath = join(tmpdir(), 'test-seek-video.mp4')
  const testData = Buffer.alloc(1024 * 1024) // 1MB
  for (let i = 0; i < testData.length; i++) {
    testData[i] = i % 256
  }
  await writeFile(testFilePath, testData)
  const fileStat = await stat(testFilePath)
  console.log(`   文件大小: ${fileStat.size} bytes`)
  assert(fileStat.size === 1024 * 1024, '文件创建成功，大小正确')

  // 2. 测试 MIME 类型
  console.log('\n2. 测试 MIME 类型')
  assert(getMimeType('video.mp4') === 'video/mp4', 'mp4 → video/mp4')
  assert(getMimeType('audio.mp3') === 'audio/mpeg', 'mp3 → audio/mpeg')
  assert(getMimeType('video.mkv') === 'video/x-matroska', 'mkv → video/x-matroska')
  assert(getMimeType('unknown.xyz') === 'application/octet-stream', '未知扩展名 → octet-stream')

  // 3. 测试 Range 头解析
  console.log('\n3. 测试 Range 头解析')
  let range = parseRangeHeader('bytes=0-1023', fileStat.size)
  assert(range !== null, 'bytes=0-1023 解析成功')
  assert(range.start === 0, 'start = 0')
  assert(range.end === 1023, 'end = 1023')
  assert(range.length === 1024, 'length = 1024')

  range = parseRangeHeader('bytes=512-', fileStat.size)
  assert(range !== null, 'bytes=512- 解析成功')
  assert(range.start === 512, 'start = 512')
  assert(range.end === fileStat.size - 1, 'end = fileSize - 1')

  range = parseRangeHeader('bytes=0-0', fileStat.size)
  assert(range !== null, 'bytes=0-0 解析成功')
  assert(range.length === 1, '单字节请求')

  range = parseRangeHeader('bytes=999999999-', fileStat.size)
  assert(range === null, '超出范围返回 null')

  // 4. 测试文件读取
  console.log('\n4. 测试文件读取')

  const fullData = await readFullFile(testFilePath)
  assert(fullData.length === fileStat.size, '完整读取大小正确')
  assert(fullData[0] === 0, '第一个字节 = 0')
  assert(fullData[255] === 255, '第256个字节 = 255')
  assert(fullData[256] === 0, '第257个字节 = 0')

  // 5. 测试 Range 读取
  console.log('\n5. 测试 Range 读取')

  const rangeData = await readFileRange(testFilePath, 0, 1024)
  assert(rangeData.length === 1024, 'Range 读取大小正确')
  assert(rangeData[0] === 0, 'Range[0] = 0')
  assert(rangeData[1023] === 255, 'Range[1023] = 255')

  const midRange = await readFileRange(testFilePath, 512, 256)
  assert(midRange.length === 256, '中间 Range 读取大小正确')
  assert(midRange[0] === 0, 'midRange[0] = 0 (512 % 256 = 0)')
  assert(midRange[255] === 255, 'midRange[255] = 255')

  const endRange = await readFileRange(testFilePath, fileStat.size - 100, 100)
  assert(endRange.length === 100, '末尾 Range 读取大小正确')

  // 6. 验证 Range 数据与完整数据一致
  console.log('\n6. 验证 Range 数据一致性')
  let consistent = true
  for (let i = 0; i < 1024; i++) {
    if (rangeData[i] !== fullData[i]) {
      consistent = false
      break
    }
  }
  assert(consistent, 'Range[0-1023] 与完整数据[0-1023] 一致')

  consistent = true
  for (let i = 0; i < 256; i++) {
    if (midRange[i] !== fullData[512 + i]) {
      consistent = false
      break
    }
  }
  assert(consistent, 'Range[512-767] 与完整数据[512-767] 一致')

  // 7. 模拟浏览器 seek 场景
  console.log('\n7. 模拟浏览器 seek 场景')
  const seekPositions = [0, 1024, 10240, 102400, 512000]
  for (const pos of seekPositions) {
    const seekRange = parseRangeHeader(`bytes=${pos}-`, fileStat.size)
    assert(seekRange !== null, `seek 到 ${pos}: Range 解析成功`)
    if (seekRange) {
      const seekData = await readFileRange(testFilePath, seekRange.start, Math.min(1024, seekRange.length))
      assert(seekData.length > 0, `seek 到 ${pos}: 读取到 ${seekData.length} bytes`)
      for (let i = 0; i < seekData.length; i++) {
        if (seekData[i] !== fullData[pos + i]) {
          assert(false, `seek 到 ${pos}: 数据不一致 at offset ${i}`)
          break
        }
      }
    }
  }

  // 清理
  await unlink(testFilePath)

  console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===\n`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((err) => {
  console.error('测试异常:', err)
  process.exit(1)
})