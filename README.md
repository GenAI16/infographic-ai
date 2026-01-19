# Infographic AI Generator

A Next.js application that generates professional infographics using Google Gemini's **Nano Banana Pro** model (`gemini-3-pro-image-preview`). Simply describe what you want, and AI creates a stunning visual infographic.

## Features

- **AI-Powered Generation**: Uses Google Gemini 3 Pro Image Preview (Nano Banana Pro) for high-quality infographic creation
- **Cloud Storage**: Generated images stored in Supabase Storage with public URLs
- **Authentication**: Secure user authentication with Supabase (email/password)
- **Google Search Integration**: Automatically fetches data from URLs and searches for real-time information
- **Optimized Prompts**: Built-in system prompt optimized for infographic design (layout, typography, data visualization)
- **High Resolution**: Generates 2K resolution images with 9:16 vertical aspect ratio
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **One-Click Download**: Download your generated infographics as PNG files

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **AI**: Google Gemini API (`@google/genai`)
- **Authentication**: Supabase Auth (`@supabase/ssr`)
- **Storage**: Supabase Storage
- **Language**: TypeScript

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd infographic-ai
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com/dashboard)
2. Go to **Settings** → **API** to get your project credentials
3. Copy your **Project URL** and **Publishable key** (or legacy anon key)
4. Run the database migration:
   - Go to **SQL Editor** in your Supabase dashboard
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL to create all tables, functions, and triggers

5. Set up Storage bucket:
   - Go to **Storage** in your Supabase dashboard
   - Click **New bucket**
   - Name: `infographics`
   - Check **Public bucket**
   - Click **Create bucket**
   - Then run `supabase/migrations/003_storage_setup.sql` in SQL Editor

### 3. Set Up API Keys

Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

Create a `.env.local` file in the project root:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

**Note**: You can find these values in your Supabase project's **Settings** → **API** page.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign up or log in** to your account (you'll receive **100 free credits** on signup!)
2. Check your credits balance in the top right corner
3. Enter a description of the infographic you want:
   - **Text prompt**: "Benefits of remote work with 5 key statistics"
   - **With URL**: "Create an infographic about https://example.com/article"
   - **Current data**: "Latest AI trends in 2026 with statistics"
2. Click "Generate"
3. Wait 10-30 seconds for AI generation (longer if fetching from URLs)
4. Download your infographic or regenerate for variations

### URL & Search Support

The AI can automatically:
- **Extract data from URLs** you provide in your prompt
- **Search for real-time information** on topics requiring current data
- **Verify facts and statistics** through Google Search
- **Include source attribution** in the infographic footer

## Project Structure

```
app/
├── actions/
│   └── generateInfographic.ts  # Server action for Gemini API
├── auth/
│   └── callback/
│       └── route.ts            # OAuth callback handler
├── components/
│   ├── HeroHeader.tsx          # Title and description
│   ├── PromptInput.tsx         # Input area with generate button
│   ├── TrustBadges.tsx         # Social proof section
│   ├── TemplateGallery.tsx      # Template browsing section
│   └── UserNav.tsx             # User navigation component
├── login/
│   └── page.tsx                # Login/signup page
├── page.tsx                     # Main application page (protected)
├── layout.tsx                   # Root layout
└── globals.css                  # Global styles
lib/
└── supabase/
    ├── client.ts               # Browser Supabase client
    ├── server.ts               # Server Supabase client
    └── proxy.ts                # Auth session proxy
middleware.ts                    # Next.js middleware for auth
supabase/
└── migrations/
    └── 001_initial_schema.sql   # Database schema
```

## Database Schema

The app uses the following database tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile information (extends auth.users) |
| `credits` | User credit balance |
| `generations` | Infographic generation history |
| `purchases` | Payment/purchase records |
| `credit_transactions` | Credit usage audit log |
| `credit_packages` | Available credit packages for purchase |

### Key Features:
- **Automatic profile creation** on user signup
- **100 free credits** given to new users
- **Credits deducted** when generating infographics (1 credit per generation)
- **Automatic refund** if generation fails
- **Fallback profile creation** for existing users who don't have profiles
- **Row Level Security** on all tables

## AI Prompt Engineering

The system uses a carefully crafted prompt that instructs the AI to:

- Use clean, organized vertical layouts with visual hierarchy
- Render text clearly and legibly with bold headers
- Apply professional color palettes with good contrast
- Include relevant icons and visual elements
- Maintain adequate white space for readability
- Structure content with title, sections, and conclusion

## API Configuration

The generation uses these settings:
- **Model**: `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Aspect Ratio**: 9:16 (vertical, ideal for infographics)
- **Resolution**: 2K
- **Response Modalities**: IMAGE and TEXT
- **Tools**: Google Search (for URL extraction and real-time data)

## Troubleshooting

| Error | Solution |
|-------|----------|
| "GEMINI_API_KEY not set" | Add your API key to `.env.local` |
| "Invalid API key" | Verify your key at [AI Studio](https://aistudio.google.com/apikey) |
| "Request blocked by safety filters" | Try a different, more neutral prompt |
| "Rate limit exceeded" | Wait a moment and try again |

## License

MIT
