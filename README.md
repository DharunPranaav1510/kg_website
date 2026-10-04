# KG Foods Website

A modern Next.js e-commerce website for KG Foods, featuring a beautiful UI built with React and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Email**: [Resend](https://resend.com/)
- **Language**: TypeScript

## Project Structure

```
├── src/
│   ├── app/              # Next.js app directory (pages, layouts, API routes)
│   ├── components/       # Reusable React components
│   ├── context/          # React context providers (e.g., CartContext)
│   ├── data/             # Static data files (products, categories, etc.)
│   └── lib/              # Utility functions (SEO helpers, etc.)
├── public/               # Static assets (images, PDFs, etc.)
├── images_raw/           # Raw image files (not deployed)
└── pyscraper.py         # Python utility for data scraping
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3001 in your browser
```

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the root directory (not committed to git):

```env
# Add any required API keys or environment variables here
```

## Deployment on Vercel

### Option 1: Deploy via GitHub (Recommended)

1. Go to [Vercel](https://vercel.com) and sign up/log in
2. Click "Add New..." → "Project"
3. Import the GitHub repository: `https://github.com/DharunPranaav1510/kg_website.git`
4. Vercel will auto-detect Next.js settings
5. Click "Deploy" and wait for the build to complete

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd "/Users/dharunpranaav/Projects/kg website"

# Deploy
vercel

# For production deployment
vercel --prod
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## Features

- ✅ Responsive design (mobile-first)
- ✅ SEO optimized (Next.js metadata, structured data)
- ✅ Product catalog with categories
- ✅ Shopping cart functionality (context-based)
- ✅ Contact form with email integration
- ✅ Blog section
- ✅ Customer testimonials
- ✅ Legal pages (Terms, Privacy, Refunds, Careers)
- ✅ About page

## API Routes

- `POST /api/contact` - Handle contact form submissions
- `POST /api/order` - Handle order submissions

## Performance Tips

- Images are optimized with Next.js Image component
- Tailwind CSS is purged for production
- Code splitting happens automatically with Next.js

## Troubleshooting

### Build fails on Vercel
- Ensure `package-lock.json` is committed
- Check for environment variable requirements
- Verify all dependencies are listed in `package.json`

### Images not loading
- Ensure images are in `/public` directory
- Use Next.js `Image` component from `next/image`

## License

Proprietary - KG Foods

## Support

For issues or questions, please contact the development team.

## Database (Supabase)

1. Create a free project at https://supabase.com.
2. SQL Editor -> paste and run `supabase/schema.sql`.
3. Project Settings -> API: copy the Project URL and the `service_role` key into `.env.local` (and Vercel env vars):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   RESEND_API_KEY=re_...
   ```
   The service_role key is server-only; never expose it to the browser.

Orders and enquiries are saved to the `orders` / `enquiries` tables, then emailed. If the Supabase vars are missing, only the email is sent.
