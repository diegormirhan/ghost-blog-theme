# diego-mirhan

Ghost 5+ theme for [blog.diegomirhan.com](https://blog.diegomirhan.com). Same look as the portfolio: a blue gradient frame around a white rounded card, Bricolage Grotesque and JetBrains Mono, and a featured carousel with a live background.

The only motion is the carousel: its background (pure CSS) and its autoplay. Both stop with `prefers-reduced-motion`, when the carousel is off screen, and when the tab is hidden. Autoplay also pauses on hover, on keyboard focus and with the pause button.

## Install

1. Zip the theme folder so that `package.json` is at the root of the zip (`cd diego-mirhan && zip -r ../diego-mirhan.zip . -x ".git/*"`).
2. Ghost Admin → Settings → Design & branding → Change theme → Upload theme → Activate.

## Ghost settings to fill in

| Where | What |
|---|---|
| General | Title `Diego` (the theme adds the dot), description (shown in the sidebar), publication icon (avatar in the sidebar), language `en` |
| Design → Branding | Accent color `#0047AB` (used by Ghost for some editor cards; the theme also overrides the button card) |
| Navigation | Primary links, for example `Home` and `About` (a "Main site ↗" link is added automatically) |
| Design → Homepage | Show carousel, seconds per item (Off/5/7/10), links for main site, GitHub, LinkedIn and Medium. Empty links hide their slide/footer entry |
| Memberships | Turn on signups to show the newsletter slide and the subscribe blocks |
| Posts | Mark posts as **Featured** to list them in the sidebar "Featured" block |

## Structure

```
default.hbs            layout: frame + card, header, footer
index.hbs              home and /page/N (carousel and featured post only on page 1)
post.hbs  page.hbs     article, static page
tag.hbs  author.hbs    archives
error.hbs              404 and other errors
pagination.hbs         newer / older
partials/              header, footer, navigation, carousel, sidebar, post-card, post-feature, subscribe
assets/css/screen.css  all styles (tokens at the top)
assets/js/main.js      carousel and mobile menu
assets/fonts/          self-hosted woff2 (Bricolage Grotesque, JetBrains Mono)
```

## Notes

- First post on the home page is shown large (the latest one). The rest go in the 3-column grid.
- Search uses Ghost's built-in search (`data-ghost-search`).
- Layout breakpoints use container queries on `body`, so the card adapts to its own width.
- Fonts come from `@fontsource-variable` packages (OFL license).

## Tested

- `gscan`: no errors or warnings (Ghost 6.x compatible).
- Ghost 6.65 running locally with this theme: home, page 2, post (Koenig cards: image wide/full, gallery, callout, toggle, button, bookmark, HTML, code, quote, list), static page (with and without title), tag, author, 404, pagination, built-in search, Portal popup, newsletter form request, Custom Settings (carousel off, seconds Off, empty links), signups off, `prefers-reduced-motion`, mobile 390px (no horizontal scroll).
- Not tested: a successful signup (needs outgoing email), a logged-in member, paid tiers, comments, custom fonts picker, other Ghost versions.

## Changelog

- 1.0.1: pagination moved to `partials/pagination.hbs` (Ghost ignored the root file), `h1` on the home page, 404 shows the status code, `[hidden]` respected by carousel controls, reduced motion now disables the background animation, button card uses the theme color.
- 1.0.0: first release.

## License

MIT for the theme code. See `LICENSE`. Fonts keep their own OFL license.
