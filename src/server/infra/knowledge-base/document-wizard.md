# Document Generation Wizard

The Document Generation Wizard is a guided, step-by-step tool that helps you create documents (quotes, clinical notes, and prevention plans) faster. It combines everything — audio recording, transcription, patient selection, template choice, and AI-powered document generation — into a single streamlined flow.

Think of it as a shortcut: instead of going to New Session, creating the session, then navigating to Create Documents separately, the wizard walks you through the entire process in one place.

## Where to Find It

- In the sidebar, click the **Generate Document** button (the one with the wand icon, shown in purple). It is located above the "New Session" button.
- The wizard opens as a full-screen overlay on top of your current page.
- Note: This button is only visible to users with **Admin** or **Manager** roles. Operations users do not have access to it.

## How It Works: The 5 Steps

The wizard has 5 steps. Depending on whether you start from scratch or use an existing session, you may skip some steps.

### Step 1 — Select or Create Session

This is the starting point. You have two options:

1. **Create New Session**: Click the "Create New Session" card to start from scratch. This takes you to Step 2, where you record audio and select a patient.
2. **Use an Existing Session**: Browse or search your recent sessions. Click on any session to use its transcription and patient data. This skips Step 2 entirely and takes you directly to Step 3 (template selection).

The left side of this screen explains what the wizard does and how it helps. The right side shows the action buttons and your session list.

### Step 2 — Audio & Patient (New Sessions Only)

This step only appears if you chose "Create New Session" in Step 1. It is split into two columns:

- **Left column (Patient)**: Search for an existing patient by name, or create a new one.
- **Right column (Audio & Transcription)**: Record audio using your microphone, or upload a pre-recorded file. The transcription appears automatically after processing. You can edit the transcription text and expand it to fullscreen for easier reading.

When both the transcription and patient are ready, click **Create Session & Continue** in the footer to create the session and move to Step 3.

### Step 3 — Template & Document Type

Choose the template and document type for your new document:

1. **Select a template** from the dropdown. These are the same templates you manage in the Templates section.
2. **Choose the document type**: Quote, Clinical Note, or Prevention.
3. Click **Create Document with AI**. The AI analyzes the transcription and fills the template automatically.

A session info badge shows which session and patient you are working with.

### Step 4 — Review & Edit

The AI-generated document content appears in a rich text editor. You can:

- Review the content for accuracy.
- Make quick edits directly in the wizard.
- Click **Save & Continue** when you are satisfied.

Don't worry about making it perfect here — you can make more detailed edits later on the full document edit page.

### Step 5 — Completion

Your document has been created and saved. This screen shows:

- A summary of the session (number, patient name).
- A list of all documents created during this wizard session.
- A **"What's next?"** box explaining what you can do on the document edit page:
  - **Quotes**: Edit content, manage items and prices, generate a public link, share with your patient via email or WhatsApp.
  - **Clinical Notes**: Edit content, print or export as PDF.
  - **Prevention**: Edit content, generate a public link, share with your patient via email or WhatsApp.

From here you can:

- **Create Another Document**: Loop back to Step 3 to create a different document type from the same session (e.g., create a quote first, then a clinical note).
- **Close Wizard**: Click on any document in the list or click "Close Wizard" to go to the document edit page.

## Wizard vs. Manual Flow

| Feature | Wizard | Manual Flow |
|---------|--------|-------------|
| Access | Sidebar > Generate Document | Sidebar > New Session |
| Steps | Guided, all in one place | Navigate between pages |
| Existing sessions | Can reuse a previous session | Must open the session first, then click Create Documents |
| Multiple documents | Loop back to Step 3 from completion | Click Create Documents each time |
| Speed | Faster for end-to-end workflow | More flexible for individual edits |

Both methods produce the exact same documents. The wizard is simply a faster way to go from audio to document. Use whichever feels more comfortable.

## Minimizing and Resuming

- You can **minimize** the wizard at any time by clicking the X button in the top-right corner. The wizard state is saved.
- A small "Resume" hint appears so you can return to where you left off.
- Minimizing is **blocked** while audio is being recorded, uploaded, or transcribed — you must wait for those processes to finish first.
- The wizard state persists in your browser. If you accidentally close the tab, you can reopen the wizard and it will resume from the last step.

## Supported Document Types

The wizard supports all three document types available in TQ:

1. **Quote** — Financial estimates with items and prices. After creation, you can manage line items, generate public links, and share via email or WhatsApp.
2. **Clinical Note** — Medical consultation documentation. After creation, you can print or export as PDF.
3. **Prevention** — Preventive care plans. After creation, you can generate public links and share via email or WhatsApp.

## Tips

- If you already have a session with a transcription (created via New Session), use the wizard with "existing session" to quickly generate additional documents without re-recording audio.
- You can create multiple documents from the same session by using the "Create Another Document" button on the completion screen.
- The wizard remembers your progress. If you minimize it or close the browser, you can resume later.
- Templates are shared between the wizard and the manual flow. Any template you create in the Templates section is available in the wizard.

## Troubleshooting

- **I don't see the Generate Document button in the sidebar**: This button is only available for Admin and Manager roles. If you have an Operations role, you will not see it. Contact your administrator to change your role if needed.
- **The wizard is stuck and won't open**: Try refreshing the page. If the issue persists, open your browser's developer tools, go to Application > Local Storage, and delete the `tq-doc-gen-wizard` entry. This resets the wizard state.
- **I selected an existing session but the transcription is empty**: Not all sessions have transcriptions. If the session was created without audio, the transcription field will be empty. The AI will still try to generate the document, but the results may be limited. Consider starting a new session with audio instead.
- **The "Create Session & Continue" button is disabled**: Both conditions must be met: (1) the transcription must be completed, and (2) a patient must be selected. Check that both are done.
- **I created a document but can't find it**: After closing the wizard, you are redirected to the document edit page. You can also find your documents in the Documents section of the sidebar, filtered by type (Quotes, Clinical Notes, Prevention).

## Frequently Asked Questions

- **Is the wizard different from New Session?** The wizard is a guided alternative that combines multiple steps into one flow. It creates the same sessions and documents as the manual flow. You can use either method — they produce identical results.
- **Can I use the wizard on mobile?** The wizard is a desktop feature. On mobile devices, you will see a message indicating it is available on tablet or computer.
- **Can I create documents for an existing session without re-recording?** Yes. In Step 1, select an existing session from the list. The wizard will use that session's transcription and patient data, skipping the audio recording step entirely.
- **What happens if I close the wizard in the middle?** Your progress is saved. When you click Generate Document again, you can resume from where you left off.
- **Can I create more than one document type from the same session?** Yes. After completing a document, click "Create Another Document" to go back to the template selection step. You can create as many documents as you need from the same session.
- **Do I need to create templates before using the wizard?** Yes. The wizard uses the same templates from the Templates section. You need at least one active template to generate a document.
