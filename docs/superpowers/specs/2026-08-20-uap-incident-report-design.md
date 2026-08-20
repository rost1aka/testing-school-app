# UAP Incident Report — Form FD-302-UAP

Design specification for a new section of the application: a long input form
with conditional fields, filed by a signed-in agent after an unidentified
aerial phenomenon has been observed.

Status: approved design, not yet implemented.
Date: 2026-08-20.

## 1. Why this section exists

This application is a practice ground for people learning software testing.
A section is worth adding here when it produces the kinds of behaviour that
are interesting to test and easy to get subtly wrong. A twenty-field form
with conditional visibility, conditional requiredness, character limits and
cross-field date rules produces exactly that: dozens of independent rules,
each of which can be checked by one observation, and many of which interact.

The subject matter — FBI agents filing a report about a UFO sighting — is
deliberately playful and carries no school-specific meaning. Nothing in this
section depends on the rest of the domain, and nothing in the rest of the
domain depends on it.

## 2. Scope

In scope:

- A new database model, `UapReport`, owned by the user who files it.
- Three API routes: create a report, list the agent's own reports, read one.
- One shared validation schema in `@school/shared`, used unchanged by both
  the API and the browser.
- Three web routes: a list, the form, and a read-only view of a filed report.
- A set of reusable form controls — select, textarea, checkbox, checkbox
  group, radio group, date — alongside the existing `Field` component.
- Spec clauses added to `docs/spec.md`.

Out of scope, deliberately:

- **Editing and deleting.** A filed report is immutable. This removes a large
  amount of surface without removing anything interesting to test.
- **Drafts and autosave.** The form holds its state in memory only. Navigating
  away loses it, and no warning is shown.
- **Attachments.** Evidence is described in text; no file is uploaded.
- **Cross-agent visibility.** An agent sees only the reports they filed.
  There is no supervisor role and no review workflow.
- **Refactoring `AddressForm`.** It duplicates field markup instead of using
  `Field`. That is a real wart, but it is not code this work touches, and
  changing it would put unrelated diffs in front of a learner.
- **A test plan.** Deciding what to test, at which level, and with which
  values is the exercise this section exists for, so this document does not
  do it. The clauses in section 13 state the behaviour precisely enough that
  each one can be checked by observation; choosing the observations is the
  reader's job. `docs/testing-guide.md` covers what each of the four levels
  is for and how to run them.

## 3. Vocabulary

These terms are used precisely throughout this document and in the spec
clauses.

**Draft.** The in-memory shape the form edits and sends over the wire. Every
text control contributes a string (possibly empty), every select contributes
its option value or `""`, the evidence checkbox group contributes an array of
option values (possibly empty), and single checkboxes contribute a boolean.
Dates contribute a `YYYY-MM-DD` string or `""`. Nothing is `null` or
`undefined` in a draft.

**Applicable.** A field is applicable when the current draft satisfies its
visibility condition. Fields with no condition are always applicable. An
inapplicable field is not rendered, not validated, and not stored.

**Required.** A field is required when it is applicable *and* satisfies its
requiredness condition. Most applicable fields are unconditionally required
or unconditionally optional; `physicalEffects` is the field whose
requiredness depends on another answer.

**Length band.** Every free-text field declares a maximum of either 255 or
1000 characters. Its minimum is derived rather than declared: **3 when the
field is currently required, 0 when it is not.** This single rule produces
all three of the bands this form needs — required short text is 3–255,
optional short text is 0–255, optional long text is 0–1000 — and it is what
makes `physicalEffects` accept an empty value on a CE-1 report while
demanding at least 3 characters on a CE-2 report.

**Character count.** Length is measured after trimming leading and trailing
whitespace, and is counted in Unicode code points (`[...value].length`), not
UTF-16 code units. A three-space value is empty, not three characters long,
and an emoji counts as one character rather than two.

## 4. Field roster

Thirty-one fields in five sections. Twenty-one are always visible; ten appear
only when another answer calls for them.

Enum values are written in the wire form (`LAS_VEGAS`); the label column shows
what the agent reads.

### 4.1 Section A — Case identification

| Field | Control | Required | Max | Rules |
|---|---|---|---|---|
| `caseNumber` | text | yes | n/a | Must match `^UAP-\d{4}-\d{4}$`, which fixes its length at 13, so no band applies. Unique across all reports. |
| `reportingAgentName` | text | yes | 255 | — |
| `badgeNumber` | text | yes | 255 | — |
| `fieldOffice` | select | yes | — | `ALBUQUERQUE`, `ANCHORAGE`, `LAS_VEGAS`, `LOS_ANGELES`, `ROSWELL`, `SEATTLE`, `WASHINGTON_DC` |
| `sightingDate` | date | yes | — | A real calendar date, not in the future. |
| `reportFiledDate` | date | yes | — | A real calendar date, not in the future, not earlier than `sightingDate`. |

### 4.2 Section B — The object

| Field | Control | Required | Max | Rules |
|---|---|---|---|---|
| `sightingLocation` | text | yes | 255 | Nearest town, landmark or coordinates. |
| `objectShape` | select | yes | — | `DISC`, `TRIANGLE`, `CIGAR`, `ORB`, `TIC_TAC`, `OTHER` |
| `objectShapeOther` | text | conditional | 255 | Visible and required only when `objectShape` is `OTHER`. |
| `objectCount` | select | yes | — | `ONE`, `TWO_TO_FIVE`, `SIX_TO_TWENTY`, `TOO_MANY` |
| `observationDuration` | select | yes | — | `UNDER_1_MIN`, `ONE_TO_5_MIN`, `FIVE_TO_30_MIN`, `OVER_30_MIN` |
| `estimatedAltitude` | select | no | — | `TREETOP`, `BELOW_CLOUD`, `ABOVE_CLOUD`, `ORBITAL`, `UNKNOWN`. May be left unselected. |
| `narrative` | textarea | yes | 1000 | What the agent observed, in their own words. |

### 4.3 Section C — Witnesses and evidence

| Field | Control | Required | Max | Rules |
|---|---|---|---|---|
| `evidenceCollected` | checkbox group | no | — | Zero or more of `PHOTOGRAPHIC`, `RADAR`, `PHYSICAL_DEBRIS`, `BIOLOGICAL_SAMPLE`, `AUDIO` |
| `debrisCustodyChain` | text | conditional | 255 | Visible and required when `evidenceCollected` contains `PHYSICAL_DEBRIS` or `BIOLOGICAL_SAMPLE`. |
| `debrisStorageLocation` | select | conditional | — | Same condition. `QUANTICO_LAB`, `HANGAR_18`, `FIELD_OFFICE_SAFE` |
| `mediaReferenceIds` | text | no | 255 | Visible when `evidenceCollected` contains `PHOTOGRAPHIC` or `AUDIO`. Optional even when visible. |
| `civilianWitnesses` | checkbox | no | — | "Civilian witnesses were present." |
| `witnessCount` | integer | conditional | — | Visible and required when `civilianWitnesses` is checked. Whole number, 1–999. |
| `witnessStatement` | textarea | conditional | 1000 | Visible and required when `civilianWitnesses` is checked. |

### 4.4 Section D — Encounter classification

| Field | Control | Required | Max | Rules |
|---|---|---|---|---|
| `encounterClass` | radio | yes | — | `CE1` sighting only, `CE2` physical effect observed, `CE3` occupant observed, `CE4` claimed interaction |
| `physicalEffects` | textarea | conditional | 1000 | **Always visible.** Optional for `CE1`; required for `CE2`, `CE3` and `CE4`. |
| `occupantDescription` | textarea | conditional | 1000 | Visible and required when `encounterClass` is `CE3` or `CE4`. |
| `missingTimeMinutes` | integer | conditional | — | Visible and required when `encounterClass` is `CE4`. Whole number, 1–10080. |
| `medicalEvaluation` | radio | conditional | — | Visible and required when `encounterClass` is `CE4`. `SCHEDULED`, `COMPLETED`, `DECLINED` |

### 4.5 Section E — Disposition

| Field | Control | Required | Max | Rules |
|---|---|---|---|---|
| `threatAssessment` | radio | yes | — | `NONE`, `LOW`, `MODERATE`, `HIGH` |
| `escalationJustification` | textarea | conditional | 1000 | Visible and required when `threatAssessment` is `HIGH`. |
| `classificationLevel` | select | yes | — | `UNCLASSIFIED`, `CONFIDENTIAL`, `SECRET`, `TOP_SECRET` |
| `notifyBureauLeadership` | checkbox | no | — | Unchecked by default. |
| `additionalRemarks` | textarea | no | 1000 | — |
| `certified` | checkbox | yes | — | "I certify that this report is accurate to the best of my knowledge." Must be checked; an unchecked box is a validation error, not a disabled button. |

### 4.6 The roster at a glance

| Control type | Count | Fields |
|---|---|---|
| Text input | 7 | `caseNumber`, `reportingAgentName`, `badgeNumber`, `sightingLocation`, `objectShapeOther`, `debrisCustodyChain`, `mediaReferenceIds` |
| Integer input | 2 | `witnessCount`, `missingTimeMinutes` |
| Select | 7 | `fieldOffice`, `objectShape`, `objectCount`, `observationDuration`, `estimatedAltitude`, `debrisStorageLocation`, `classificationLevel` |
| Date | 2 | `sightingDate`, `reportFiledDate` |
| Textarea | 6 | `narrative`, `witnessStatement`, `physicalEffects`, `occupantDescription`, `escalationJustification`, `additionalRemarks` |
| Checkbox | 3 | `civilianWitnesses`, `notifyBureauLeadership`, `certified` |
| Checkbox group | 1 | `evidenceCollected` |
| Radio group | 3 | `encounterClass`, `medicalEvaluation`, `threatAssessment` |

| Length band | Fields |
|---|---|
| Required, 3–255 | `reportingAgentName`, `badgeNumber`, `sightingLocation`, `objectShapeOther`, `debrisCustodyChain` |
| Optional, 0–255 | `mediaReferenceIds` |
| Required, 3–1000 | `narrative`, `witnessStatement`, `occupantDescription`, `escalationJustification` |
| Optional, 0–1000 | `additionalRemarks`, and `physicalEffects` while `encounterClass` is `CE1` |

## 5. Conditional logic

### 5.1 The rules, in one table

| Field | Visible when | Required when visible |
|---|---|---|
| `objectShapeOther` | `objectShape === "OTHER"` | always |
| `debrisCustodyChain` | `evidenceCollected` contains `PHYSICAL_DEBRIS` or `BIOLOGICAL_SAMPLE` | always |
| `debrisStorageLocation` | same as above | always |
| `mediaReferenceIds` | `evidenceCollected` contains `PHOTOGRAPHIC` or `AUDIO` | never |
| `witnessCount` | `civilianWitnesses === true` | always |
| `witnessStatement` | `civilianWitnesses === true` | always |
| `physicalEffects` | always | `encounterClass` is `CE2`, `CE3` or `CE4` |
| `occupantDescription` | `encounterClass` is `CE3` or `CE4` | always |
| `missingTimeMinutes` | `encounterClass === "CE4"` | always |
| `medicalEvaluation` | `encounterClass === "CE4"` | always |
| `escalationJustification` | `threatAssessment === "HIGH"` | always |

Every other field is always visible, and is required or optional exactly as
section 4 states.

### 5.2 How a condition behaves when it flips

These are the rules that decide whether the feature is correct, and they are
the ones most likely to be implemented wrongly.

1. **Appearing.** A field appears in place, in its section, as soon as the
   controlling answer is given. No page reload, no confirmation step.
2. **Disappearing clears.** When a field stops being applicable its value is
   discarded immediately. If the agent types a debris custody chain, then
   unchecks "Physical debris", the text is gone. Re-checking the box shows an
   empty field, not the earlier text. A form that preserves the hidden value
   and silently submits it is a defect.
3. **Disappearing clears errors too.** Any error message shown against a
   field disappears with the field, and the error summary re-counts.
4. **Inapplicable fields are never sent.** The draft the browser posts omits
   them entirely.
5. **The server does not trust the browser.** It recomputes applicability
   from the same rules. A value supplied for an inapplicable field is
   ignored, not stored, and not an error — the report is still accepted.
   This is forgiving on purpose: a rejection here would surface as a
   confusing error against a field the agent cannot see.
6. **Requiredness changes do not clear anything.** Moving `encounterClass`
   from `CE2` back to `CE1` makes `physicalEffects` optional again, but the
   text the agent already wrote stays, and it is still stored.

### 5.3 One definition, two consumers

The visibility rules live in exactly one place — a function exported from
`@school/shared` — and are called from two:

- the React form, to decide what to render;
- the validation schema's `superRefine`, to decide what to require.

There is no second copy of the rules on the server, and none in the
component. This is the whole reason the schema is shared: a conditional form
whose front and back disagree about when a field matters produces errors an
agent cannot act on.

## 6. Validation rules and their messages

The API contract for a validation failure already exists and does not change:
status `400`, body `{ "code": "VALIDATION_FAILED", "message": "Check the
highlighted fields", "fieldErrors": { … } }`, where `fieldErrors` is keyed by
field name and each value is an array of messages. The browser produces the
same structure locally from the same schema, so both paths render
identically.

### 6.1 Message catalogue

`{Label}` is the field's visible label; `{n}` is the current character count.

| Rule | Message |
|---|---|
| Required text or textarea is empty | `{Label} is required.` |
| Non-empty but under 3 characters | `{Label} must be at least 3 characters.` |
| Over the maximum | `{Label} must be at most 255 characters (currently {n}).` — 1000 where that is the maximum |
| Required select has no selection | `Select a field office.` — the verb phrase differs per field |
| Required radio group has no selection | `Choose an encounter classification.` |
| `certified` is unchecked | `You must certify the report before filing it.` |
| Date is missing | `{Label} is required.` |
| Date is not a real calendar date | `Enter a valid date in YYYY-MM-DD format.` |
| Date is in the future | `{Label} cannot be in the future.` |
| `reportFiledDate` earlier than `sightingDate` | `The report date cannot be earlier than the sighting date.` |
| `caseNumber` does not match the pattern | `Case number must look like UAP-2026-0042.` |
| `caseNumber` already on file | `That case number is already on file.` |
| Integer field empty | `{Label} is required.` |
| Integer field not a whole number, or out of range | `Witness count must be a whole number between 1 and 999.` / `Missing time must be a whole number between 1 and 10080.` |

### 6.2 Rules that deserve spelling out

- **Trimming happens before every check.** `"   "` fails a required field.
  `"  ok  "` is two characters after trimming and fails the minimum. Stored
  values are the trimmed ones.
- **A field can carry more than one message.** `fieldErrors` values are
  arrays, and all of a field's failures are shown together as a list.
- **Length is checked even when the value is optional.** An optional 0–255
  field still rejects 300 characters.
- **The maximum is not enforced by the input.** No `maxlength` attribute is
  set. The agent can type past the limit and is told about it, rather than
  finding that the field silently stopped accepting keystrokes. This is a
  deliberate choice, and it is what makes the over-limit case testable
  through the UI at all.
- **Cross-field errors attach to the later field.** The date-order failure is
  reported against `reportFiledDate`, because that is the value the agent
  should change.
- **A duplicate case number is a field error, not a generic one.** The API
  answers `409` with `code: "CASE_NUMBER_TAKEN"` and a `fieldErrors` entry
  under `caseNumber`, so the browser shows it in the same place as every
  other case-number problem.

## 7. Submitting, and what an invalid submit looks like

### 7.1 Before the first submit

No field shows an error, whatever the agent types or leaves empty. Required
fields are marked as required in their label (a visible marker plus
`aria-required`), but nothing is red and nothing is announced. A long form
that turns red while it is still being filled in trains people to ignore it.

### 7.2 Pressing "File report" on an invalid form

All of the following happen, and none of them is optional:

1. **No request is sent.** The browser validates the draft first; a failure
   means the network is never touched.
2. **Every invalid field is marked.** A red border, `aria-invalid="true"`,
   and its messages listed immediately beneath it, linked by
   `aria-describedby`.
3. **A summary appears at the top of the form**, with `role="alert"`, reading
   `This report was not filed. 4 fields need your attention.` — singular
   `1 field needs your attention.` when there is one. Beneath it is a list of
   the invalid fields by label; each entry is a link that moves focus to that
   field.
4. **Focus moves to the first invalid field** in document order, so a
   keyboard or screen-reader user lands on something they can fix rather than
   having to hunt for it.
5. **The page scrolls to the summary** if it is out of view.
6. **The submit button stays enabled.** It is never disabled because the form
   is invalid — a disabled button explains nothing. It is disabled only while
   a request is in flight, where its label reads `Filing…`.
7. **Only applicable fields are validated.** A hidden field is never the
   reason a submit fails, and never appears in the summary.

### 7.3 After the first failed submit

Validation becomes live, per field: a field re-checks itself on every change,
so its message disappears the moment the value becomes valid and reappears if
it becomes invalid again. Fields that have never been invalid stay quiet
until the next submit. The summary re-counts on every change and disappears
when nothing is left to fix.

Textareas with a 1000-character maximum show a counter — `132 / 1000` — which
is present from the start and is styled as an error once the count exceeds the
maximum.

### 7.4 A successful submit

The button disables and reads `Filing…`; the browser posts the draft; on
`201` it navigates to `/reports/uap/{id}`, which shows the filed report
read-only with a confirmation banner naming the case number. Re-submitting is
impossible because the button is disabled while the request is in flight and
the page has navigated away by the time it would re-enable.

If the API answers `400` or `409` anyway — a rule the browser did not catch,
or a case number claimed by someone else in the meantime — the response's
`fieldErrors` are merged into the same display, and the same focus and
summary behaviour applies. If the request fails for any other reason, the
summary shows the API's `message`, or `Something went wrong` when there is
none, and nothing about the filled-in form is lost.

## 8. The shared schema

A new module, `packages/shared/src/uap-report.ts`, exported from the package
index. It holds the enums, the draft shape, the visibility rules, the
validation schema and the option labels — everything both tiers need to agree
on, and nothing else.

The outline below shows the module's exported surface. Where a body would say
nothing a reader cannot already infer, only the signature is given.

```ts
import { z } from "zod";

export const FIELD_OFFICES = [
  "ALBUQUERQUE", "ANCHORAGE", "LAS_VEGAS", "LOS_ANGELES",
  "ROSWELL", "SEATTLE", "WASHINGTON_DC",
] as const;
export const OBJECT_SHAPES = ["DISC", "TRIANGLE", "CIGAR", "ORB", "TIC_TAC", "OTHER"] as const;
export const EVIDENCE_TYPES = [
  "PHOTOGRAPHIC", "RADAR", "PHYSICAL_DEBRIS", "BIOLOGICAL_SAMPLE", "AUDIO",
] as const;
export const ENCOUNTER_CLASSES = ["CE1", "CE2", "CE3", "CE4"] as const;
// …and one for each remaining select and radio group.

/** The shape the form edits and the browser posts. Never null, never undefined. */
export const uapReportDraftSchema = z.object({
  caseNumber: z.string(),
  reportingAgentName: z.string(),
  badgeNumber: z.string(),
  fieldOffice: z.string(),
  sightingDate: z.string(),
  reportFiledDate: z.string(),
  sightingLocation: z.string(),
  objectShape: z.string(),
  objectShapeOther: z.string(),
  objectCount: z.string(),
  observationDuration: z.string(),
  estimatedAltitude: z.string(),
  narrative: z.string(),
  evidenceCollected: z.array(z.string()),
  debrisCustodyChain: z.string(),
  debrisStorageLocation: z.string(),
  mediaReferenceIds: z.string(),
  civilianWitnesses: z.boolean(),
  witnessCount: z.string(),
  witnessStatement: z.string(),
  encounterClass: z.string(),
  physicalEffects: z.string(),
  occupantDescription: z.string(),
  missingTimeMinutes: z.string(),
  medicalEvaluation: z.string(),
  threatAssessment: z.string(),
  escalationJustification: z.string(),
  classificationLevel: z.string(),
  notifyBureauLeadership: z.boolean(),
  additionalRemarks: z.string(),
  certified: z.boolean(),
});

export type UapReportDraft = z.infer<typeof uapReportDraftSchema>;
export type UapFieldName = keyof UapReportDraft;

const hasCustodyEvidence = (d: UapReportDraft) =>
  d.evidenceCollected.includes("PHYSICAL_DEBRIS") ||
  d.evidenceCollected.includes("BIOLOGICAL_SAMPLE");

/** The single definition of conditional visibility. Section 5.1, in code. */
const VISIBLE_WHEN: Partial<Record<UapFieldName, (d: UapReportDraft) => boolean>> = {
  objectShapeOther: (d) => d.objectShape === "OTHER",
  debrisCustodyChain: (d) => hasCustodyEvidence(d),
  debrisStorageLocation: (d) => hasCustodyEvidence(d),
  mediaReferenceIds: (d) =>
    d.evidenceCollected.includes("PHOTOGRAPHIC") || d.evidenceCollected.includes("AUDIO"),
  witnessCount: (d) => d.civilianWitnesses,
  witnessStatement: (d) => d.civilianWitnesses,
  occupantDescription: (d) => d.encounterClass === "CE3" || d.encounterClass === "CE4",
  missingTimeMinutes: (d) => d.encounterClass === "CE4",
  medicalEvaluation: (d) => d.encounterClass === "CE4",
  escalationJustification: (d) => d.threatAssessment === "HIGH",
};

const REQUIRED_WHEN: Partial<Record<UapFieldName, (d: UapReportDraft) => boolean>> = {
  estimatedAltitude: () => false,
  evidenceCollected: () => false,
  mediaReferenceIds: () => false,
  civilianWitnesses: () => false,
  notifyBureauLeadership: () => false,
  additionalRemarks: () => false,
  physicalEffects: (d) => d.encounterClass !== "" && d.encounterClass !== "CE1",
};

export function isApplicable(field: UapFieldName, draft: UapReportDraft): boolean {
  return VISIBLE_WHEN[field]?.(draft) ?? true;
}

export function isRequired(field: UapFieldName, draft: UapReportDraft): boolean {
  return isApplicable(field, draft) && (REQUIRED_WHEN[field]?.(draft) ?? true);
}

/** Validates a draft and normalises it into the shape that gets stored. */
export const uapReportSchema = uapReportDraftSchema
  .superRefine((draft, ctx) => { /* every rule in section 6, keyed by field */ })
  .transform((draft) => toStoredReport(draft));

export type UapReportInput = z.infer<typeof uapReportSchema>;

/** Turns a ZodError into the fieldErrors envelope both tiers render. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]>;

/** An empty draft — the form's initial state, and a test fixture. */
export const emptyUapReportDraft: UapReportDraft;

/** Visible labels, for rendering and for error messages. */
export const UAP_LABELS: Record<UapFieldName, string>;
export const UAP_OPTION_LABELS: Record<string, string>;
```

`toStoredReport` trims every string, maps `""` to `null` for optional fields,
drops the value of every inapplicable field to `null`, and parses the two
integer fields into numbers. Because the transform runs after the refinement,
a stored report is always internally consistent: no CE-1 report carries an
occupant description.

`toFieldErrors` is the same joining logic the API's `ZodValidationPipe`
already performs inline. Moving it here and having the pipe call it is a
small, targeted change to existing code, and it is what guarantees the
browser and the API produce identical error payloads.

## 9. Data model

A new model in `apps/api/prisma/schema.prisma`, plus a migration.

```prisma
enum FieldOffice { ALBUQUERQUE ANCHORAGE LAS_VEGAS LOS_ANGELES ROSWELL SEATTLE WASHINGTON_DC }
enum ObjectShape { DISC TRIANGLE CIGAR ORB TIC_TAC OTHER }
enum ObjectCount { ONE TWO_TO_FIVE SIX_TO_TWENTY TOO_MANY }
enum ObservationDuration { UNDER_1_MIN ONE_TO_5_MIN FIVE_TO_30_MIN OVER_30_MIN }
enum EstimatedAltitude { TREETOP BELOW_CLOUD ABOVE_CLOUD ORBITAL UNKNOWN }
enum EvidenceType { PHOTOGRAPHIC RADAR PHYSICAL_DEBRIS BIOLOGICAL_SAMPLE AUDIO }
enum StorageLocation { QUANTICO_LAB HANGAR_18 FIELD_OFFICE_SAFE }
enum EncounterClass { CE1 CE2 CE3 CE4 }
enum MedicalEvaluation { SCHEDULED COMPLETED DECLINED }
enum ThreatLevel { NONE LOW MODERATE HIGH }
enum ClassificationLevel { UNCLASSIFIED CONFIDENTIAL SECRET TOP_SECRET }

model UapReport {
  id                      String               @id @default(cuid())
  userId                  String
  caseNumber              String               @unique
  reportingAgentName      String
  badgeNumber             String
  fieldOffice             FieldOffice
  sightingDate            DateTime             @db.Date
  reportFiledDate         DateTime             @db.Date
  sightingLocation        String
  objectShape             ObjectShape
  objectShapeOther        String?
  objectCount             ObjectCount
  observationDuration     ObservationDuration
  estimatedAltitude       EstimatedAltitude?
  narrative               String
  evidenceCollected       EvidenceType[]
  debrisCustodyChain      String?
  debrisStorageLocation   StorageLocation?
  mediaReferenceIds       String?
  civilianWitnesses       Boolean              @default(false)
  witnessCount            Int?
  witnessStatement        String?
  encounterClass          EncounterClass
  physicalEffects         String?
  occupantDescription     String?
  missingTimeMinutes      Int?
  medicalEvaluation       MedicalEvaluation?
  threatAssessment        ThreatLevel
  escalationJustification String?
  classificationLevel     ClassificationLevel
  notifyBureauLeadership  Boolean              @default(false)
  additionalRemarks       String?
  certified               Boolean
  createdAt               DateTime             @default(now())
  user                    User                 @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Every conditionally-applicable field is nullable, because a valid report may
legitimately lack it. Every unconditionally-required field is not nullable,
so the database itself refuses a report the schema should have rejected.
`caseNumber` is unique across all agents, not per agent — a case number
identifies a case in the Bureau, not in one agent's folder.

`User` gains `uapReports UapReport[]`.

The seed script gains two reports for `admin@example.com`: one minimal CE-1
with no evidence, and one maximal CE-4 with every conditional field filled,
so that the list and detail pages have something to show on a freshly seeded
database.

## 10. API

A new `ReportsModule` in `apps/api/src/reports/`, guarded by `JwtAuthGuard`
in its entirety. Routes live under `/reports/uap`.

| Method | Path | Success | Notes |
|---|---|---|---|
| `POST` | `/reports/uap` | `201` with the created report | Body validated by `new ZodValidationPipe(uapReportSchema)` |
| `GET` | `/reports/uap` | `200` with an array | The signed-in agent's own reports, newest first |
| `GET` | `/reports/uap/:id` | `200` with one report | Only the agent's own |

Failure responses, all in the existing envelope:

| Situation | Status | `code` |
|---|---|---|
| No or expired access token | `401` | `UNAUTHENTICATED` |
| A rule in section 6 fails | `400` | `VALIDATION_FAILED`, with `fieldErrors` |
| `caseNumber` already exists | `409` | `CASE_NUMBER_TAKEN`, with `fieldErrors.caseNumber` |
| Report belongs to another agent | `403` | `FORBIDDEN` |
| No such report | `404` | `NOT_FOUND` |

Another agent's report answers `403` rather than `404`, matching `USER-02`,
which already chose `403` for reaching another user's data.

The uniqueness check is done by catching Prisma's unique-constraint violation
on insert rather than by reading first and then writing, so two simultaneous
reports claiming one case number cannot both succeed.

## 11. Web tier

### 11.1 Routes

| Route | Contents |
|---|---|
| `/reports/uap` | The agent's filed reports — case number, sighting date, shape, threat level — and a link to file a new one. Empty state: "No reports on file." |
| `/reports/uap/new` | The form. |
| `/reports/uap/{id}` | One filed report, read-only. Conditional fields that do not apply are omitted rather than shown empty. |

All three sit behind `RequireAuth`, as `/profile` and `/addresses` do. The
header gains a "Reports" link for signed-in agents, alongside the existing
ones.

### 11.2 Components

New, under `apps/web/components/uap/`:

- `UapReportForm.tsx` — owns the draft state, the "has been submitted once"
  flag, the per-field error map and the submit sequence.
- `ValidationSummary.tsx` — the `role="alert"` block from section 7.2, taking
  the error map and the labels, rendering the count and the list of links.

New, under `apps/web/components/` beside the existing `Field.tsx`, because
they are not specific to this form:

- `SelectField.tsx`, `TextareaField.tsx` (with the character counter),
  `CheckboxField.tsx`, `CheckboxGroupField.tsx`, `RadioGroupField.tsx`,
  `DateField.tsx`.

Every one of them takes the same props as `Field` — `id`, `label`, `value`,
`onChange`, `errors` — plus `required`. New fields go through these
components; the inline-markup pattern in `AddressForm` is not repeated.

### 11.3 State

The form holds one `UapReportDraft` in `useState`, initialised from
`emptyUapReportDraft`. Changing a controlling answer runs the draft through a
normalising step that clears every field which has just become inapplicable —
so rule 2 of section 5.2 is enforced in one place rather than in each
handler.

Errors live in a single `FieldErrors` map, whatever their origin: local
validation, an API `400`, or an API `409`. The rendering code cannot tell the
difference, which is what makes the two paths behave identically.

## 12. Accessibility

`USER-05` already requires every input to have a programmatically associated
label. This form adds the parts that clause does not reach:

- Each radio group and the evidence checkbox group is a `<fieldset>` with a
  `<legend>`; the group's errors are linked to the fieldset by
  `aria-describedby`, not to an individual input.
- A required field carries `aria-required="true"` as well as a visible marker.
  The marker is not conveyed by colour alone.
- An invalid field carries `aria-invalid="true"` and points at its message
  list through `aria-describedby`. The red border is not the only signal.
- The character counter is linked to its textarea through `aria-describedby`
  and is not announced on every keystroke.
- The summary is `role="alert"`, so it is announced when it appears. Its
  entries are links that move focus to the field they name.
- A field that appears because of a conditional answer is inserted where it
  belongs in the tab order, and focus is not stolen from the control the
  agent just used.

## 13. Spec clauses

These are added to `docs/spec.md` under a new heading, in the numbered style
the rest of that document uses. They are the oracle: a learner reporting a
defect in this section cites one of them.

```
## UAP incident report

UAP-01   Filing, listing and reading UAP incident reports requires a signed-in
         user. An unauthenticated request returns 401.
UAP-02   A report belongs to the agent who filed it. Listing returns only that
         agent's reports, and requesting another agent's report returns 403.
UAP-03   A filed report cannot be edited or deleted.
UAP-04   The form requires a case number, reporting agent name, badge number,
         field office, sighting date, report date, sighting location, object
         shape, object count, observation duration, narrative, encounter
         classification, threat assessment, classification level, and the
         certification checkbox. Estimated altitude, evidence collected, media
         reference ids, additional remarks and the leadership notification are
         optional.
UAP-05   A required free-text value must be 3 to 255 characters, or 3 to 1000
         for a textarea. An optional one may be empty, and is otherwise bound
         by the same maximum.
UAP-06   Text is trimmed of leading and trailing whitespace before it is
         validated and before it is stored. A value of only whitespace counts
         as empty. Length is counted in Unicode code points.
UAP-07   The case number must match UAP-YYYY-NNNN. Filing a report with a case
         number already on file returns 409 and reports the problem against
         the case number field.
UAP-08   Neither the sighting date nor the report date may be in the future,
         and the report date may not be earlier than the sighting date. The
         ordering failure is reported against the report date.
UAP-09   Choosing "Other" as the object shape reveals a required free-text
         field describing the shape.
UAP-10   Selecting physical debris or a biological sample as evidence reveals
         a required custody chain field and a required storage location.
         Selecting photographic or audio evidence reveals an optional media
         reference field.
UAP-11   Checking "civilian witnesses were present" reveals a required witness
         count, a whole number between 1 and 999, and a required witness
         statement.
UAP-12   Encounter classification CE-2, CE-3 or CE-4 makes the physical
         effects field required; CE-1 leaves it optional. The field is visible
         in every case.
UAP-13   Encounter classification CE-3 or CE-4 reveals a required occupant
         description. CE-4 additionally reveals a required missing-time value,
         a whole number between 1 and 10080, and a required medical evaluation
         choice.
UAP-14   A threat assessment of High reveals a required escalation
         justification.
UAP-15   A field that stops applying loses its value immediately, along with
         any error shown against it, and reappears empty if it applies again.
         A value for a field that does not apply is never stored.
UAP-16   Submitting an invalid form sends no request to the server.
UAP-17   When a submission is rejected, every invalid field shows its own
         message beside it, and a summary at the top of the form states how
         many fields need attention and links to each of them.
UAP-18   When a submission is rejected, focus moves to the first invalid field
         in document order.
UAP-19   No field shows an error before the first submission attempt. After a
         rejected submission, each field that was invalid rechecks itself as
         it is edited, and its message disappears as soon as the value becomes
         valid.
UAP-20   The submit button is never disabled because the form is invalid. It
         is disabled only while a submission is in flight.
UAP-21   Character limits are not enforced by the input itself: a value longer
         than the maximum can be typed, and is reported as an error naming the
         limit and the current length.
UAP-22   A successful filing returns 201 and shows the filed report read-only,
         confirming the case number.
```

## 14. Implementation order

This design is larger than one sitting, and it has two clean seams. It should
become three implementation plans, executed in this order:

1. **The shared schema.** `packages/shared/src/uap-report.ts`, plus moving
   `toFieldErrors` out of `ZodValidationPipe` and into the shared package.
   Nothing in it depends on a decision made later, and both stages below
   depend on all of it.
2. **The API.** The Prisma model and migration, `ReportsModule`, and the seed
   rows. Depends on stage 1 for its schema and on nothing in the web tier.
3. **The web tier.** The field components, the form, the three routes and the
   header link. Depends on both earlier stages, and is the only stage that
   can be judged by looking at it.

Splitting anywhere else produces a stage that cannot be exercised on its own.

## 15. Decisions worth revisiting later

These were settled deliberately and cheaply, and none of them is load-bearing
for the rest of the design:

- **Ignoring inapplicable values rather than rejecting them** (section 5.2,
  rule 5). Rejecting would catch a buggy client sooner but produces an error
  the agent cannot act on. If a stricter contract is ever wanted, it belongs
  behind a separate clause, not as a change to this one.
- **A global unique case number.** Per-agent uniqueness would be friendlier
  and less realistic.
- **No draft saving.** The most likely first follow-up, and the reason the
  draft type is a plain serialisable object with no `null`s in it.
- **Immutability.** Amending a filed report by filing a linked supplement is
  closer to how such a form really works than editing it in place would be.
