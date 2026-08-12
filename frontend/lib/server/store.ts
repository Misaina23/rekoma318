// In-memory cache used as a fallback when the filesystem is not writable
// (e.g. Vercel serverless functions run on a read-only filesystem).
const memory = new Map<string, unknown>()

// Persisted JSON files live in the repo's data/ directory (read-only on Vercel).
function resolve(file: string) {
  return `data/${file}`
}

async function readFile(file: string): Promise<string | null> {
  try {
    const fsMod = await import('fs')
    const fs = fsMod.promises
    return await fs.readFile(file, 'utf-8')
  } catch {
    return null
  }
}

async function writeFile(file: string, content: string) {
  try {
    const fsMod = await import('fs')
    const fs = fsMod.promises
    await fs.writeFile(file, content, 'utf-8')
  } catch {
    // Filesystem is read-only (Vercel) — ignore, data stays in memory only.
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  const cached = memory.get(file)
  if (cached !== undefined) return cached as T

  const raw = await readFile(resolve(file))
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
  await writeFile(resolve(file), JSON.stringify(data, null, 2))
}
