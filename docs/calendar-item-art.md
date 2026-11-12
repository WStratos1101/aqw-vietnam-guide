# Calendar Class Item artwork

Checked 2026-11-11 for the Class Codex UI refinement. No item-specific local
assets were found. Wiki item pages link artwork, but binary downloads failed:
local curl cannot resolve aqwwiki.wikidot.com; the web fetcher reports cache
misses for aqwwiki.wdfiles.com images. A fresh download attempt also failed to
connect to aqwwiki.wdfiles.com. The web fetcher can read Hourglass of Power (1)
and confirms its artwork link, but cannot retrieve the linked PNG. Infinite
Corruption, Hourglass of Paradise (2), Timepiece of Inevitability and Timepiece
of Pestilence pages returned redirect loops. These are unavailable assets, not
evidence that no artwork exists.

All 12 entries currently use labelled category pictograms in cards and setup
chips (Hourglass, Corruption, Timepiece). None is claimed as verified item art.
No production hotlinks or generic misc icons are used. `IconArt` supports local
`item.image`, with an error fallback, for when bytes can be acquired and inspected.

| Year | Item source page | Linked artwork observed (not locally verified) |
| --- | --- | --- |
| 2019 | https://aqwwiki.wikidot.com/class-item-hourglass-of-power-1 | https://aqwwiki.wdfiles.com/local--files/classes-skills/ChronoHGoPo.png |
| 2019 | https://aqwwiki.wikidot.com/class-item-hourglass-of-paradise-1 | https://aqwwiki.wdfiles.com/local--files/classes-skills/ChronoHGoPa.png |
| 2019 | https://aqwwiki.wikidot.com/class-item-hourglass-of-transience-1 | https://aqwwiki.wdfiles.com/local--files/classes-skills/ChronoHGoT.png |
| 2019 | https://aqwwiki.wikidot.com/class-item-entropic-corruption | https://aqwwiki.wdfiles.com/local--files/classes-skills/ChronoEC.png |
| 2019 | https://aqwwiki.wikidot.com/class-item-foresee-corruption | https://aqwwiki.wdfiles.com/local--files/classes-skills/ChronoFC.png |
| 2019 | https://aqwwiki.wikidot.com/class-item-infinite-corruption | Page unavailable |
| 2020 | https://aqwwiki.wikidot.com/class-item-hourglass-of-power-2 | https://aqwwiki.wdfiles.com/local--files/classes-skills/TimelessHGoPo.png |
| 2020 | https://aqwwiki.wikidot.com/class-item-hourglass-of-paradise-2 | Download unavailable |
| 2020 | https://aqwwiki.wikidot.com/class-item-hourglass-of-transience-2 | Download unavailable |
| 2020 | https://aqwwiki.wikidot.com/class-item-timepiece-of-inevitability | Download unavailable |
| 2020 | https://aqwwiki.wikidot.com/class-item-timepiece-of-madness | https://aqwwiki.wdfiles.com/local--files/classes-skills/TimelessTM.png |
| 2020 | https://aqwwiki.wikidot.com/class-item-timepiece-of-pestilence | Download unavailable |

Keep the item page as attribution when importing its image; inspect the image
before assigning a local path under `public/images/aqw/`. Do not substitute
class/armor artwork or reconstruct the icon from an unverified filename.
