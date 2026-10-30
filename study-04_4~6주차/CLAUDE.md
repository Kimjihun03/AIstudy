# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pure HTML/CSS/JavaScript to-do manager app with no frameworks or external dependencies. Single-page application stored entirely in browser localStorage.

## Running the App

Open `index.html` directly in a browser (double-click works). No build step, dev server, or build tools required.

## Architecture

**State Management:**
- `todos` array: Single source of truth for all to-do data
- `currentFilter`: Tracks active category filter ('all', 'work', 'personal', 'study')
- localStorage key 'todos': Persists todos across sessions

**Key Patterns:**
- All user input rendered with `textContent` (not `innerHTML`) to prevent XSS
- Event delegation on `#todoList` for check/delete actions instead of individual listeners
- Filtering happens in `render()` only—`todos` array is never mutated by filter state
- Empty state: Shows "할 일을 추가해보세요" when filter returns zero items

## Development Notes

- **No libraries or frameworks**: DOM manipulation only; fetch or extend as needed
- **Category colors** are defined in CSS with `.todo-category.work/personal/study` classes. Add to both HTML class and CSS if new categories are added.
- **Mobile-friendly**: Container max-width 600px, flex layout for list items, responsive input group
- **Korean-language UI**: All text is Korean; `getCategoryLabel()` maps category values to Korean labels
- **Persistence**: Always call `save()` after mutating todos, and always call `render()` after state changes
