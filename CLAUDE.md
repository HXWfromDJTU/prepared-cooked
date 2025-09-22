# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start
- **Run**: `python -m http.server 8000` or open `index.html` directly
- **Tech**: Phaser.js 3.70.0, pure frontend, no build process
- **Controls**: WASD/arrows to move, spacebar to interact

## Architecture
**Entry**: `js/main.js` → `PreparedCookedGame` class
**Scenes**: `MenuScene`, `GameScene` (3min timer)
**Entities**: `Player` (grid-based), `Kitchen` (ring layout), `Food` (4 states)
**Systems**: `OrderSystem`, `ScoreSystem` 
**Data**: `GameData` (config, recipes, localStorage)

## Core Game Flow
Storage → Microwave → Prep Station → Assembly → Serve

## Key Technical Details
- 40x40px grid system for movement/positioning
- 4 ingredient states: raw → defrosted → prepared → finished
- Ring kitchen layout with categorized storage areas
- Real-time order progress with urgency indicators