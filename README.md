# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Database Migrations

To generate a new migration:  
```bash
npm run migrate:generate -- --name &lt;migration_name&gt;
```

To apply migrations:  
```bash
NEON_DB_URL="postgresql://..." npm run migrate:push
```
