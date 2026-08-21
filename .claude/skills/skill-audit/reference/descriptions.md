# Descriptions

The `description` drives discovery — Claude picks among 100+ skills by it alone. It must say WHAT the skill does AND WHEN to use it, in the 3rd person, with specific trigger terms. ≤ 1024 chars.

## Rules
- **3rd person.** Good: "Processes Excel files and generates reports." Avoid: "I can help you…", "You can use this to…".
- **Specific + key terms + concrete triggers.** Both what and when.

## Good
- `Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`
- `Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.`

## Bad — flag these
- `Helps with documents` · `Processes data` · `Does stuff with files` (vague, no triggers)
