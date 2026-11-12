# wildcardz web

Static site for the Wildcardz landing page, privacy policy, terms and support. No build step.

Deploy on Vercel: import the repo, set **Root Directory = `web`**, Framework Preset = **Other**, no build command.
`vercel.json` turns on clean URLs, so the pages live at `/`, `/privacy`, `/terms`, `/support`.

After adding your custom domain, update the app's `.env`:
EXPO_PUBLIC_PRIVACY_URL=https://<domain>/privacy
EXPO_PUBLIC_TERMS_URL=https://<domain>/terms
