---
"@macrostrat/form-components": minor
---

Add `OAuthLoginForm`, an email-and-password login form with "Continue with
Google/Facebook/Apple" options below it (Rockd's `/login` form), and
`oauthProviders(authBaseURL)` to build those options for a server that starts
each provider's flow at `<authBaseURL>/<id>`
