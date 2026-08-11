# Frontend migration checklist (Next.js)

Goal: make the frontend a pure Next.js client with no backend code.

Steps to apply in the `frontend/` app (or existing `src/` converted to Next app):

1. Remove all Next.js API Routes (`pages/api` or `app/api`).
2. Remove server-only files like `src/server.ts`, `src/start.ts`, Nitro config that runs server code inside frontend.
3. Replace any `getServerSideProps`, Server Actions, or server-only data fetching with client fetches to the backend API.
   - Use `fetch(process.env.NEXT_PUBLIC_API_URL + '/api/...')` from the client.
4. Add a small API client layer `lib/api.js` that centralizes `fetch` calls and error handling.
5. For auth, call `POST ${NEXT_PUBLIC_API_URL}/api/auth/login` and store the token via secure cookie (HttpOnly) set by backend or in-memory.
6. Environment variables: only `NEXT_PUBLIC_*` allowed in the frontend. Add `NEXT_PUBLIC_API_URL`.
7. Ensure Vercel-only config: `vercel.json` remains minimal and `framework` is `next`.
8. The frontend no longer uses a root `public/` folder for default CMS data; backend stores CMS data inside `backend/data`.
8. Run locally: `npm run dev` in frontend, it should not run any server-only code.

Example API client snippet:

```js
export async function apiFetch(path, opts = {}) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${path}`
  const res = await fetch(url, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

If you want, I can apply these changes to your current repo: remove server files from the frontend and add an `lib/api.ts` and example refactors for a couple of pages.
