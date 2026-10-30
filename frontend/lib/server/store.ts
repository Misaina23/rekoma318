import os from 'os'
import path from 'path'

// In-memory cache + OS temp directory persistence so runtime state never dirties
// the Git workspace and degrades gracefully on read-only serverless filesystems.
const memory = new Map<string, unknown>()

function resolveRuntimePath(file: string) {
  return path.join(os.tmpdir(), 'rekoma-runtime', file)
}

function resolveSeedPath(file: string) {
  return path.join(process.cwd(), 'data', file)
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    const fsMod = await import('fs')
    return await fsMod.promises.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

async function writeFileSafe(filePath: string, content: string) {
  try {
    const fsMod = await import('fs')
    await fsMod.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fsMod.promises.writeFile(filePath, content, 'utf-8')
  } catch {
    // Ignore on read-only filesystems; data stays in memory.
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  const cached = memory.get(file)
  if (cached !== undefined) return cached as T

  const runtimeRaw = await readFileSafe(resolveRuntimePath(file))
  const raw = runtimeRaw !== null ? runtimeRaw : await readFileSafe(resolveSeedPath(file))

  if (raw === null) {
    memory.set(file, fallback)
    return fallback
  }
  try {
    const parsed = JSON.parse(raw) as T
    memory.set(file, parsed)
    return parsed
  } catch {
    memory.set(file, fallback)
    return fallback
  }
}

export async function writeJson(file: string, data: unknown) {
  memory.set(file, data)
  await writeFileSafe(resolveRuntimePath(file), JSON.stringify(data, null, 2))
}
