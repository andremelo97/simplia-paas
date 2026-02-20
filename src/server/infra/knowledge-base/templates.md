# Templates

Templates are reusable document structures that standardize your clinical documentation.

## Types of Templates

1. **Clinical Note Templates**: For medical documentation (e.g., consultation notes, treatment plans).
2. **Quote Templates**: For estimating treatment costs with pre-defined items.
3. **Prevention Templates**: For preventive care recommendations.

## Creating Templates

1. Navigate to **Templates** in the sidebar.
2. Click **Create Template**.
3. Give it a title and description.
4. Write the template content using the rich text editor.
5. Use **template variables** to create dynamic content.

## Template Syntax

Templates support three types of special syntax:

### System Variables (`$variable$`)

Variables wrapped in `$...$` are automatically replaced with system data:

- `$transcription$` — Full session transcription text
- `$patient.fullName$` — Patient's full name
- `$session.created_at$` — Session creation date
- `$me.fullName$` — Your full name (the professional)
- `$me.clinic$` — Clinic name

### AI Placeholders (`[placeholder]`)

Text wrapped in `[...]` is a placeholder that the AI fills based on the transcription content:

- Example: `[patient's main complaint]` — AI will extract the complaint from the transcription
- Example: `[recommended treatment plan]` — AI will generate a treatment plan based on what was discussed

### AI Instructions (`(instruction)`)

Text wrapped in `(...)` provides instructions to the AI on how to generate content. These instructions are **removed from the final output**:

- Example: `(use formal medical terminology)`
- Example: `(summarize in bullet points)`

## AI Template Filling

When you use "Create Documents" in a session:
1. Select a template from the list.
2. The AI reads the session transcription.
3. It fills in the template fields intelligently.
4. You can review and edit before saving.

## Managing Templates

- Templates can be activated or deactivated.
- Track usage count for each template.
- Import templates from the **Marketplace** (curated by LivoCare).

## Marketplace

- Access pre-built templates organized by medical specialty.
- Import templates with one click.
- Templates are available in both English and Portuguese.
