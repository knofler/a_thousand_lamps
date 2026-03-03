# A Thousand Lamps — Full Build Plan

**Saved:** 2026-03-03
**Source:** User-provided project brief
**Status:** In progress — build kicked off same session

---

## 1. PROJECT OVERVIEW

A charity website for "A Thousand Lamps" — a Bangladesh-based charitable initiative.
The site functions like a modern social media feed (doom-scrolling style) with:

- Rich media posts (photos + Facebook/Instagram embeds)
- Charity program sections
- Celebration (donate) CTAs
- Admin panel for content management
- MongoDB for data persistence

**Stack:** Next.js 14 (App Router) · MongoDB · Tailwind CSS · Docker · Vercel

---

## 2. REPOSITORY STRUCTURE

```
a-thousand-lamps/
├── app/                        # Next.js App Router
│   ├── (public)/               # Public-facing routes
│   │   ├── page.tsx            # Home / feed page
│   │   ├── about/page.tsx
│   │   ├── programs/page.tsx
│   │   ├── celebrate/page.tsx  # Donation page
│   │   ├── story/page.tsx      # Comic story page
│   │   └── transparency/page.tsx
│   ├── (admin)/                # Admin routes (protected)
│   │   ├── admin/page.tsx      # Admin dashboard
│   │   ├── admin/posts/page.tsx
│   │   ├── admin/upload/page.tsx
│   │   └── admin/embeds/page.tsx
│   ├── api/                    # API routes (same repo)
│   │   ├── posts/route.ts      # GET all posts, POST new post
│   │   ├── posts/[id]/route.ts # GET, PUT, DELETE single post
│   │   ├── upload/route.ts     # Image upload handler
│   │   ├── embeds/route.ts     # Save embed URLs
│   │   └── auth/route.ts       # Admin auth (simple token)
│   └── layout.tsx
├── components/
│   ├── feed/
│   │   ├── FeedContainer.tsx   # Infinite scroll wrapper
│   │   ├── PostCard.tsx        # Single post card
│   │   ├── PhotoPost.tsx       # Photo post type
│   │   ├── EmbedPost.tsx       # Facebook/Instagram embed
│   │   └── StoryPost.tsx       # Story-style card
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── ProgramCard.tsx
│   │   ├── ComicStory.tsx
│   │   └── TransparencySection.tsx
│   ├── ui/
│   │   ├── CelebrateButton.tsx # 🎉 Main CTA button
│   │   ├── DonationModal.tsx
│   │   ├── NavBar.tsx
│   │   └── Footer.tsx
│   └── admin/
│       ├── AdminNav.tsx
│       ├── PostEditor.tsx
│       ├── EmbedForm.tsx
│       └── ImageUploader.tsx
├── lib/
│   ├── mongodb.ts              # MongoDB connection singleton
│   ├── models/
│   │   ├── Post.ts             # Post model (Mongoose)
│   │   └── Program.ts          # Program model
│   └── utils.ts
├── public/
│   ├── images/
│   │   └── lamp-logo.svg
│   └── fonts/
├── .env.local                  # Local env vars
├── .env.example                # Committed env template
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── vercel.json
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 3. ENVIRONMENT VARIABLES

**.env.example** (commit this)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/athousandlamps
# For production: mongodb+srv://user:pass@cluster.mongodb.net/athousandlamps

# Admin Auth
ADMIN_SECRET_TOKEN=change_this_to_a_secure_random_string

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_SITE_URL=https://athousandlamps.org
NEXT_PUBLIC_APP_NAME=A Thousand Lamps
```

**.env.local** (never commit — for local dev)
```env
MONGODB_URI=mongodb://mongo:27017/athousandlamps
ADMIN_SECRET_TOKEN=dev_secret_123
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. MONGODB SETUP

**lib/mongodb.ts**
```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env');
}

let cached = global.mongoose as { conn: any; promise: any } | undefined;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached!.conn) return cached!.conn;
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
```

**lib/models/Post.ts**
```typescript
import mongoose, { Schema } from 'mongoose';

const PostSchema = new Schema({
  type: {
    type: String,
    enum: ['photo', 'embed', 'story', 'program'],
    required: true,
  },
  title: String,
  caption: String,
  imageUrl: String,         // Cloudinary URL for photo posts
  embedUrl: String,         // Facebook/Instagram embed URL
  embedType: {
    type: String,
    enum: ['facebook', 'instagram'],
  },
  tags: [String],           // e.g., ['ramadan', 'eid', 'limb-support']
  program: String,          // which program this belongs to
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  order: { type: Number, default: 0 }, // manual ordering
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
```

---

## 5. API ROUTES

- `GET /api/posts` — returns paginated posts (`?page=1&limit=10&type=photo&tag=eid`)
- `POST /api/posts` — create new post (admin auth required)
- `GET /api/posts/:id`
- `PUT /api/posts/:id` — admin only
- `DELETE /api/posts/:id` — admin only
- `POST /api/upload` — accepts multipart/form-data, uploads to Cloudinary
- `POST /api/embeds` — saves a Facebook/Instagram embed URL as a new Post

**Authentication pattern:**
```typescript
// lib/auth.ts
export function isAdminAuthorized(request: Request): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return token === process.env.ADMIN_SECRET_TOKEN;
}
```

---

## 6. FEED / SOCIAL SCROLLING

- **FeedContainer.tsx** — Intersection Observer API for infinite scroll, skeleton loaders
- **PostCard.tsx** — renders PhotoPost, EmbedPost, or StoryPost by `post.type`
- **EmbedPost.tsx** — Facebook `fb-post` div or Instagram `instagram-media` blockquote

Facebook SDK (in layout.tsx):
```html
<div id="fb-root"></div>
<script async defer crossorigin="anonymous"
  src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0">
</script>
```

Instagram embed (in layout.tsx):
```html
<script async src="//www.instagram.com/embed.js"></script>
```

**Pre-seeded Facebook posts:**
```
https://www.facebook.com/566331855/posts/10162044664316856/
https://www.facebook.com/566331855/posts/10162039903561856/
https://www.facebook.com/566331855/posts/10162035854171856/
https://www.facebook.com/566331855/posts/10162035632001856/
https://www.facebook.com/566331855/posts/10162028874891856/
https://www.facebook.com/566331855/posts/10162024289666856/
https://www.facebook.com/ruhan78/videos/932883306344048/
https://www.facebook.com/566331855/posts/10162012927771856/
https://www.facebook.com/566331855/posts/10162011143416856/
https://www.facebook.com/566331855/posts/10162004948141856/
https://www.facebook.com/566331855/posts/10162003527351856/
https://www.facebook.com/share/v/1aaYSi2og9/
https://www.facebook.com/566331855/posts/10161955658831856/
https://www.facebook.com/share/1DZoDEs1jx/
```

---

## 7. PAGE DESIGNS

**Home** (top to bottom):
1. NavBar — Logo + "Celebrate 🎉" button
2. HeroSection — full viewport, golden gradient, lamp SVG, headline, big CTA
3. Programs Strip — horizontal scroll: Ramadan | Eid Gifts | Mega Eid | Limb Support
4. Live Feed — infinite scroll PostCards
5. ComicStory — "The Boy Who Lit a Lamp"
6. TransparencySection — stats + accountability badges
7. Footer

**Celebrate/Donate:**
- Donation tiers: 1000, 3000, 5000, custom
- Payment options: bKash, Nagad, Bank Transfer, International Card
- QR codes / account details per method
- Animated 🎉 Celebrate button

**Admin Dashboard:** Protected by token in sessionStorage. Stats + quick actions.

**Admin Upload:** Drag-and-drop (CldUploadWidget), caption, tags, program, preview, submit.

**Admin Embeds:** Paste FB/Instagram URL, auto-detect type, caption, tags, submit.

---

## 8. DESIGN SYSTEM

**tailwind.config.ts colors:**
```js
colors: {
  lamp: {
    gold: '#F5A623',
    goldLight: '#FFF3CC',
    green: '#1B5E20',
    greenLight: '#4CAF50',
    cream: '#FFF8F0',
    dark: '#1A1A1A',
  }
}
```

**Typography:** Playfair Display (headings) + Inter (body)

**CelebrateButton:**
```tsx
<button className="bg-lamp-gold text-white px-8 py-4 rounded-full text-xl font-bold
  shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse">
  🎉 Celebrate
</button>
```

---

## 9. DOCKER SETUP

**Dockerfile** — multi-stage: deps → builder → runner (node:20-alpine, standalone output)

**docker-compose.yml** — services: `app` (port 3000) + `mongo` (port 27017, volume mongo_data)

**docker-compose.prod.yml** — uses built image + `.env.production`

**next.config.ts:**
```typescript
const nextConfig = {
  output: 'standalone',  // Required for Docker
  images: {
    domains: ['res.cloudinary.com', 'scontent.fbcdn.net'],
  },
};
export default nextConfig;
```

---

## 10. VERCEL DEPLOYMENT

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

**Vercel Environment Variables:**
- `MONGODB_URI` — MongoDB Atlas URI
- `ADMIN_SECRET_TOKEN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_SITE_URL`

---

## 11. SEED SCRIPT

`scripts/seed.ts` — seeds 14 Facebook posts into MongoDB as embed posts.
Run with: `npx tsx scripts/seed.ts`

---

## 12. PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "npx tsx scripts/seed.ts",
    "docker:dev": "docker-compose up --build",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up -d"
  }
}
```

**Key dependencies:** next@14, react@18, mongoose@8, cloudinary@2, next-cloudinary@5, react-intersection-observer

---

## 13. BUILD ORDER

1. `npx create-next-app@latest` with --typescript --tailwind --app
2. Install deps: mongoose, cloudinary, next-cloudinary, react-intersection-observer, tsx
3. `.env.example` and `.env.local`
4. `lib/mongodb.ts` and `lib/models/Post.ts`
5. All API routes (`app/api/...`)
6. Design system — tailwind.config.ts lamp colors
7. UI components (NavBar, Footer, CelebrateButton, DonationModal)
8. Feed components (FeedContainer, PostCard, PhotoPost, EmbedPost, StoryPost)
9. Section components (HeroSection, ProgramCard, ComicStory, TransparencySection)
10. All public pages: Home → Programs → Celebrate → Story → Transparency
11. Admin pages: Dashboard → Upload → Embeds → Posts Manager
12. Dockerfile + docker-compose.yml + docker-compose.prod.yml
13. vercel.json + next.config.ts
14. scripts/seed.ts
15. `npm run dev` — verify
16. `docker-compose up` — verify
17. `npm run build` — verify

---

## 14. IMPORTANT NOTES

- **Facebook embeds:** Call `window.FB?.XFBML?.parse()` after dynamic insertion.
- **Instagram embeds:** Call `window.instgrm?.Embeds?.process()` after dynamic insertion.
- **Admin auth:** Store token in `sessionStorage`. Send as `Authorization: Bearer TOKEN`.
- **Image uploads:** Use `CldUploadWidget` from next-cloudinary.
- **Infinite scroll:** Use `react-intersection-observer` sentinel div pattern.
- **No NextAuth** — single secret token is sufficient for MVP.
- **MongoDB:** Docker Compose for local, Atlas for Vercel production.
- **`output: 'standalone'`** in next.config.ts is mandatory for Docker.

---

## 15. FUTURE ENHANCEMENTS (not in MVP)

- Multi-language support (Bengali + English)
- Real donation processing (SSLCommerz)
- Comment system
- Email newsletter signup
- Analytics dashboard
- PWA / service worker
