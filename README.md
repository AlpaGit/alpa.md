# alpa.md

Password-protected markdown sharing. Upload or paste markdown, get a shareable link with a generated password. Content is encrypted before it ever touches the server.

## How it works

**Creator flow:**
1. Drop a `.md` file or paste markdown
2. Get a shareable URL and a one-time password
3. Share both (or use the auto-decrypt link with the password embedded in the hash)

**Reader flow:**
1. Open the link
2. Enter the password (or use the auto-decrypt link)
3. View the rendered markdown

## Security

- **AES-256-GCM** encryption with **PBKDF2-HMAC-SHA256** key derivation (310,000 iterations)
- Server stores only ciphertext, IV, salt, and auth tag — never plaintext
- Passwords are generated (24 chars, URL-safe) and shown once
- Auto-decrypt links use the URL hash fragment (`#password`), which never leaves the browser
- Generic error messages on decryption failure to prevent information leakage
- API body size limits and input normalization

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm
- Node.js `crypto` (AES-256-GCM, PBKDF2)
- File-based JSON storage

## Getting started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

The app runs at `http://localhost:3000` by default.

## Deployment

Deploy to [Vercel](https://vercel.com/) with zero configuration — just connect the repo.

> **Note:** The default file-based storage (`data/documents.json`) works for single-instance deployments. For multi-instance or serverless environments, swap the storage adapter for a database.

## Project structure

```
src/
  app/
    api/
      documents/
        route.ts              # POST /api/documents (create)
        [id]/decrypt/route.ts # POST /api/documents/:id/decrypt
    r/[id]/page.tsx           # Reader page
    page.tsx                  # Home page (create flow)
    layout.tsx                # Root layout
  components/
    create-form.tsx           # Upload/paste form
    result-panel.tsx          # URL + password display
    decrypt-form.tsx          # Password input + auto-decrypt
    markdown-renderer.tsx     # Rendered markdown output
  lib/
    crypto.ts                 # AES-256-GCM encrypt/decrypt, password generation
    storage.ts                # File-based JSON persistence
    validation.ts             # Input validation + body size guards
  types/
    document.ts               # Shared TypeScript types and DTOs
```

## License

[MIT](LICENSE)
