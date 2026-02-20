# Templates

Templates are reusable document structures that standardize your clinical documentation. Templates are **generic** — they are not tied to a specific document type. The same template can be used when creating any type of document (clinical note, quote, or prevention). The document type is chosen when you create the document from a session, not when you create the template.

When combined with AI, templates are filled automatically using the session transcription.

## Creating a Template

1. Navigate to **Templates** in the sidebar.
2. Click **Create Template**.
3. Give it a clear, descriptive title (e.g., "Dermatology Consultation Note" or "Botox Treatment Quote"). The title must be at least 3 characters.
4. Add an optional description to help other users understand when to use it.
5. Write the template content using the rich text editor. Use template variables, AI placeholders, and AI instructions as described below.
6. Toggle **Active** on or off (active by default).
7. Save the template.

Any template you create will be available for selection when creating any document type (clinical note, quote, or prevention) from a session.

## Template Creation Guide

When creating or editing a template, a Template Creation Guide appears on the right side of the page. It explains the three types of syntax you can use, with color-coded examples. Here is the full content of the guide:

### Placeholders: `[placeholder]`

Wrapped in square brackets. These will be filled with information from the session dialogue, clinical notes, or contextual notes. The AI reads the transcription and generates content for each placeholder.

Examples: `[Chief Complaint]`, `[Treatment Plan]`, `[summarize the patient's main concerns]`

The more specific you write the placeholder, the better the AI fills it. For example, `[list the three main areas of concern mentioned by the patient]` is more specific than `[concerns]`.

### Instructions: `(instruction)`

Wrapped in round brackets. These guide the AI on how to behave when generating content. Instructions are removed from the final output — the patient never sees them.

Examples: `(Be concise, use 2-3 sentences maximum)`, `(If not mentioned in the transcription, write "Not evaluated")`, `(Use bullet points)`

### System Variables: `$variable$`

Wrapped in double dollar signs. These are filled automatically with database values when the document is created. They do not use AI — they are direct data lookups.

Complete list of available variables:

- `$patient.first_name$` — Patient's first name
- `$patient.last_name$` — Patient's last name
- `$patient.fullName$` — Patient's full name (first + last)
- `$date.now$` — Current date
- `$session.created_at$` — Session creation date
- `$me.first_name$` — Your first name (the logged-in professional)
- `$me.last_name$` — Your last name
- `$me.fullName$` — Your full name (first + last)
- `$me.clinic$` — Your clinic name
- `$transcription$` — The full transcription text from the session

### Complete Example

Here is a full template example combining all three syntax types:

```
Dear $patient.fullName$, your appointment on $session.created_at$ was [summarize findings].

Dr. $me.fullName$ from $me.clinic$ recommends [treatment plan]. (Only include if mentioned in transcript)

Next appointment: [next appointment details]
```

## Template Syntax

Templates support three types of special syntax that make documents dynamic and intelligent:

### System Variables: `$variable$`

System variables are wrapped in dollar signs and are automatically replaced with real data from the system. They do not use AI — they are direct data lookups.

Available system variables:

- `$patient.first_name$` — The patient's first name only.
- `$patient.last_name$` — The patient's last name only.
- `$patient.fullName$` — The patient's full name (first + last).
- `$me.first_name$` — Your first name (the logged-in professional).
- `$me.last_name$` — Your last name.
- `$me.fullName$` — Your full name (first + last).
- `$me.clinic$` — Your clinic's name.
- `$date.now$` — Today's date, formatted for your locale.
- `$session.created_at$` — The date when the session was created.
- `$transcription$` — The full transcription text from the session.

**Example usage in a template:**

```
Patient: $patient.fullName$
Professional: $me.fullName$
Clinic: $me.clinic$
Date: $date.now$
```

This would produce:

```
Patient: Maria Silva
Professional: Dr. Carlos Souza
Clinic: Clinica Estetica Bella
Date: February 20, 2026
```

### AI Placeholders: `[placeholder]`

Text wrapped in square brackets tells the AI to generate content for that section based on the session transcription. The AI reads the transcription and fills in the relevant information.

**Common examples:**

- `[Chief Complaint]` — AI extracts the patient's main reason for the visit.
- `[History of Present Illness]` — AI summarizes what the patient described about their condition.
- `[Physical Examination Findings]` — AI extracts examination details mentioned during the consultation.
- `[Diagnosis]` — AI writes the diagnosis based on the discussion.
- `[Treatment Plan]` — AI generates the recommended treatment plan.
- `[Recommended Procedures]` — AI lists the procedures discussed.
- `[Follow-up Instructions]` — AI writes aftercare or follow-up recommendations.

You can write any descriptive text inside the brackets. The more specific you are, the better the AI fills it. For example, `[list the three main areas of concern mentioned by the patient]` is more specific than `[concerns]`.

### AI Instructions: `(instruction)`

Text wrapped in parentheses provides guidance to the AI on how to write the content. These instructions are **removed from the final document** — the patient or reader never sees them.

**Common examples:**

- `(Be concise, use 2-3 sentences maximum)` — Limits the AI's output length.
- `(Use formal medical terminology)` — Tells the AI to use professional language.
- `(Summarize in bullet points)` — Requests a specific format.
- `(If not mentioned in the transcription, write "Not evaluated")` — Handles missing information.
- `(Write in third person)` — Controls the writing perspective.

### Putting It All Together: Example Template

```
CONSULTATION NOTE
Date: $date.now$
Patient: $patient.fullName$
Professional: $me.fullName$

CHIEF COMPLAINT
(Be concise, one sentence)
[Patient's main reason for the visit]

HISTORY OF PRESENT ILLNESS
(Summarize in a short paragraph)
[Detailed history of the current condition as described by the patient]

PHYSICAL EXAMINATION
(Use medical terminology, organize by body area)
[Physical examination findings]

DIAGNOSIS
[Primary diagnosis and any secondary findings]

TREATMENT PLAN
(List as numbered items)
[Recommended treatments and procedures]

FOLLOW-UP
[Follow-up schedule and instructions for the patient]

_____________________________
$me.fullName$
$me.clinic$
```

## AI Template Filling

When you create a document from a session and select a template:

1. The system replaces all `$variable$` entries with actual data.
2. The AI reads the full session transcription.
3. The AI fills each `[placeholder]` with relevant content from the transcription.
4. The AI follows any `(instructions)` to control tone, format, and detail level.
5. Instructions in parentheses are removed from the final output.
6. You review the result and can edit anything before saving.

## Marketplace Templates

- The **Marketplace** offers ready-made templates curated by LivoCare, organized by medical specialty (dermatology, aesthetics, general practice, etc.).
- Import templates with one click — they are added to your template library immediately.
- Marketplace templates are available in both English and Portuguese.
- Imported templates can be customized after importing. You can modify the content, add or remove placeholders, and adapt them to your clinic's needs.
- Check the Marketplace regularly for new templates added by the LivoCare team.

## Managing Templates

- Templates can be **activated** or **deactivated**. Deactivated templates do not appear when creating documents but are not deleted.
- Each template shows a **usage count** so you can see which templates are most popular in your clinic.
- You can duplicate an existing template to create a variation without starting from scratch.

## Troubleshooting

- **AI did not fill a placeholder correctly**: The most common cause is low-quality transcription. If the information was not mentioned during the consultation, the AI cannot extract it. Review the transcription for completeness and accuracy before generating documents. Also, make the placeholder text more specific (e.g., `[patient's blood pressure reading]` instead of `[vitals]`).
- **Template is too complex and AI output is messy**: Simplify the template. Break long sections into smaller placeholders. Use AI instructions to control the format (e.g., `(answer in one sentence)` or `(use bullet points)`).
- **System variable is not being replaced**: Check the syntax — variables must be wrapped in dollar signs with no spaces (e.g., `$patient.fullName$` not `$ patient.fullName $`). Also verify you are using a valid variable name from the list above.
- **Template does not appear when creating a document**: Make sure the template is activated. All active templates appear when creating any document type. If you deactivated it, go to Templates and toggle it back to active.
- **Imported marketplace template needs changes**: After importing, open the template from your Templates list and edit it freely. Marketplace templates are copies — your changes do not affect the original.

## Tips

- Start with Marketplace templates and customize them. This is faster than building from scratch.
- Use AI instructions generously. They help the AI produce exactly what you need and are invisible to the patient.
- Test your template by creating a document from a session with a good transcription. If the output is not what you expected, adjust the placeholders and instructions.
- Keep templates focused. A template designed for one purpose (e.g., consultation notes) works better than a single template that tries to do everything.
- Name your templates clearly so all staff members know which one to use for each type of consultation.

## Frequently Asked Questions

- **Can I share templates with other clinics?** Currently, templates are private to your clinic. You can submit templates to LivoCare for consideration in the Marketplace.
- **How many templates can I create?** There is no limit on the number of templates.
- **Can I use a template without AI?** Yes. If your template has only system variables and no AI placeholders, it will be filled with data only — no AI processing is needed. You can also manually write content in the editor after selecting a template.
- **What if the transcription does not mention something the template asks for?** The AI will either skip it or write a generic statement. Use the instruction `(If not mentioned in the transcription, write "Not discussed")` to handle missing information gracefully.
- **Can I undo changes to a template?** There is no version history for templates. If you make a mistake, you may need to recreate the section manually. Consider duplicating a template before making major edits.
