async function ensureFile(file: string, fallback: unknown) {
  const path = await import('path')
  const fsMod = await import('fs')
  const fs = fsMod.promises
  const DATA_DIR = path.join(process.cwd(), 'data')
  const full = path.join(DATA_DIR, file)
  try {
    await fs.access(full)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(full, JSON.stringify(fallback, null, 2), 'utf-8')
  }
  return full
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  const full = await ensureFile(file, fallback)
  try {
    const fsMod = await import('fs')
    const fs = fsMod.promises
    const raw = await fs.readFile(full, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJson(file: string, data: unknown) {
  const full = await ensureFile(file, data)
  const fsMod = await import('fs')
  const fs = fsMod.promises
  await fs.writeFile(full, JSON.stringify(data, null, 2), 'utf-8')
}
