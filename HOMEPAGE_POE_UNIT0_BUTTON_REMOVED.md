# Homepage POE Unit 0 Button Removal Report

Removed homepage button/card links that referred to POE Unit 0.

## Removal counts

- `\s*<a\b[^>]*href="[^"]*(?:aerospace-systems-engineering|poe|...`: 1
- `\s*<a\b[^>]*>[^<]*(?:POE\s*Unit\s*0|Unit\s*0\s*POE|Aerospace...`: 0
- `\s*<article\b(?:(?!</article>).)*?(?:POE\s*Unit\s*0|Unit\s*0...`: 0
- `\s*<div\b[^>]*class="[^"]*(?:card|button|quick|resource|acti...`: 0

## Homepage phrase check

- `POE Unit 0`: 0
- `Aerospace Systems Engineering Unit 0`: 0
- `unit-0.html`: 0
- `Unit 0`: 1
