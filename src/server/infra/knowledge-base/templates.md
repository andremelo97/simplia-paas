# Templates

Templates are reusable document structures that standardize your clinical documentation. They define the layout and content of your quotes, clinical notes, and prevention documents. When combined with AI, templates are filled automatically using the session transcription.

## Types of Templates

1. **Clinical Note Templates**: Structures for medical documentation such as consultation notes, treatment plans, initial assessments, and follow-up records.
2. **Quote Templates**: Layouts for treatment cost estimates with pre-defined item categories and descriptions.
3. **Prevention Templates**: Structures for preventive care recommendations, wellness plans, and aftercare instructions.

## Creating a Template

1. Navigate to **Templates** in the sidebar.
2. Click **Create Template**.
3. Choose the template type (clinical note, quote, or prevention).
4. Give it a clear, descriptive title (e.g., "Dermatology Consultation Note" or "Botox Treatment Quote").
5. Add an optional description to help other users understand when to use it.
6. Write the template content using the rich text editor. Use template variables, AI placeholders, and AI instructions as described below.
7. Save the template.

## Template Syntax

Templates support three types of special syntax that make documents dynamic and intelligent:

### System Variables: `$variable$`

System variables are wrapped in dollar signs and are automatically replaced with real data from the system. They do not use AI — they are direct data lookups.

Available system variables:

- `$patient.first_name$` — The patient's first name only.
- `$patient.fullName$` — The patient's full name.
- `$me.fullName$` — Your full name (the logged-in professional).
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
- **Template does not appear when creating a document**: Make sure the template is activated and matches the document type you are trying to create (clinical note template for clinical notes, quote template for quotes).
- **Imported marketplace template needs changes**: After importing, open the template from your Templates list and edit it freely. Marketplace templates are copies — your changes do not affect the original.

## Tips

- Start with Marketplace templates and customize them. This is faster than building from scratch.
- Use AI instructions generously. They help the AI produce exactly what you need and are invisible to the patient.
- Test your template by creating a document from a session with a good transcription. If the output is not what you expected, adjust the placeholders and instructions.
- Keep templates focused. One template per document type works better than a single template that tries to do everything.
- Name your templates clearly so all staff members know which one to use for each type of consultation.

## Frequently Asked Questions

- **Can I share templates with other clinics?** Currently, templates are private to your clinic. You can submit templates to LivoCare for consideration in the Marketplace.
- **How many templates can I create?** There is no limit on the number of templates.
- **Can I use a template without AI?** Yes. If your template has only system variables and no AI placeholders, it will be filled with data only — no AI processing is needed. You can also manually write content in the editor after selecting a template.
- **What if the transcription does not mention something the template asks for?** The AI will either skip it or write a generic statement. Use the instruction `(If not mentioned in the transcription, write "Not discussed")` to handle missing information gracefully.
- **Can I undo changes to a template?** There is no version history for templates. If you make a mistake, you may need to recreate the section manually. Consider duplicating a template before making major edits.
