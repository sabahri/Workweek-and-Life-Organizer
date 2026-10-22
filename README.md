# Planner

A single-page personal planner that runs entirely in the browser. No server, no build step, no dependencies beyond two Google Fonts.

## Tabs

- **Week**: the same week repeated once per theme (for example Work, Personal, Meals), with a "This week" row for tasks without a set day, all-day events, priority flags, done/not-done marks, sub-tasks, colour-coded sub-themes, money spent with daily totals, optional day sections (Breakfast, Lunch, Dinner, Snacks, Exercise, Water), resizable day columns and a month calendar below.
- **Projects**: projects split into sub-goals, each with tasks and sub-tasks. Tasks can be scheduled onto the week.
- **Library**: books grouped into genres and subgenres, with reading status, interest level, series, search and drag-and-drop.
- **Recipes**: recipes in categories, with parts and components, automatic calorie, carb and protein totals (overall and per serving), remembered ingredients and pasted ingredient lists.
- **Pantry**: a spreadsheet-style inventory with several packs per item, each with its own amount, calories and expiry date (calories can be worked out from kcal per 100 g or 100 ml), plus a calorie total and how many days of food that is for your household.

## Running it

Open `index.html` in a browser. Data is saved in that browser's local storage.
Use **Export backup** and **Import backup** at the top to save or move your data as a JSON file.

## Data

No personal data is stored in this repository. All entries live in the browser, or in backup files you keep yourself. Backup files (`planner-backup-*.json`) are listed in `.gitignore` so they don't get committed by accident.
