# Workweek-and-Life organiser

A single-page personal planner that runs entirely in the browser: no build step, no server, no dependencies beyond two Google Fonts.

## Views

- **Week**: one row per theme (Work, Personal, …) across seven days, plus a "This week" row for tasks without a set day, an all-day event strip, an optional daily spending row and a month overview. Tasks can be dragged between days and themes, flagged high priority, given sub-tasks, sub-themes and amounts spent.
- **Projects**: projects split into sub-goals, each with its own task list. Sub-goals pack into a tight masonry grid, and any sub-goal can be starred as **active** (highlighted in dark orange). Give a task a date and it appears on the week.
- **Library**: a book catalogue grouped into genres and subgenres, with reading status, interest rating, languages and series.
- **Recipes**: recipes split into parts and components, with calories, carbs and protein that add up per part and per serving. The app learns an ingredient's nutrition once and scales it next time.
- **Pantry**: items with multiple packs, expiry dates, calories per 100 g/ml, a "still needed" list, and how many days of food and water you have.

## Running it

Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server
# then open http://localhost:8000
```

It also works on GitHub Pages: in the repo settings, set Pages to deploy from the `main` branch, root folder.

## Where data lives

Everything is saved to the browser's `localStorage` (key `planner-state-v1`), so it stays on that device and in that browser. Use **Export backup** to download a JSON file and **Import backup** to restore it, or to move your data to another browser or device.

When the page runs as a claude.ai artifact it also syncs to the owner's account. Outside claude.ai that code finds nothing to connect to and is skipped.

## Files

```
index.html     markup and dialogs
css/style.css  all styles, light and dark themes
js/app.js      all behaviour and rendering
```
