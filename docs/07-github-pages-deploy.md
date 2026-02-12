# GitHub Pages + Custom Domain Plan

## Why GitHub Pages
- Free static hosting
- Easy open-source workflow
- Good fit for React/Vite build output

## Deployment Approach
- Build and deploy with GitHub Actions.
- Publish `dist/` via Pages artifact.
- Use custom domain after first successful deploy.

## Steps
1. Push repository to GitHub.
2. In repo settings, enable GitHub Pages with "GitHub Actions" source.
3. Ensure workflow `.github/workflows/deploy-pages.yml` is active.
4. After first deploy, set custom domain in Pages settings.
5. Configure DNS:
   - apex domain: `A/AAAA` (or `ALIAS/ANAME`)
   - subdomain (e.g. `www`): `CNAME` to `username.github.io`
6. Verify domain and enforce HTTPS.

## DNS Security Notes
- Do not use wildcard DNS records (`*.example.com`) for Pages.
- Verify domain ownership to reduce takeover risk.

## Operational Limits To Keep In Mind
- Recommended repository source limit: 1 GB.
- Published site limit: 1 GB.
- Soft bandwidth: 100 GB/month.
- Deployment timeout: 10 minutes.

## Sources
- GitHub Pages limits: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- Managing custom domain: <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>
- Verifying custom domain: <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages>

