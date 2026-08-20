import { z } from "zod";

/**
 * Form FD-302-UAP. Every rule the browser and the API have to agree on lives
 * here, because a conditional form whose tiers disagree about when a field
 * matters produces errors nobody can act on. See
 * docs/superpowers/specs/2026-08-20-uap-incident-report-design.md.
 */

// ---------------------------------------------------------------- options --

export const FIELD_OFFICES = [
  "ALBUQUERQUE",
  "ANCHORAGE",
  "LAS_VEGAS",
  "LOS_ANGELES",
  "ROSWELL",
  "SEATTLE",
  "WASHINGTON_DC",
] as const;
export const OBJECT_SHAPES = ["DISC", "TRIANGLE", "CIGAR", "ORB", "TIC_TAC", "OTHER"] as const;
export const OBJECT_COUNTS = ["ONE", "TWO_TO_FIVE", "SIX_TO_TWENTY", "TOO_MANY"] as const;
export const OBSERVATION_DURATIONS = [
  "UNDER_1_MIN",
  "ONE_TO_5_MIN",
  "FIVE_TO_30_MIN",
  "OVER_30_MIN",
] as const;
export const ESTIMATED_ALTITUDES = [
  "TREETOP",
  "BELOW_CLOUD",
  "ABOVE_CLOUD",
  "ORBITAL",
  "UNKNOWN",
] as const;
export const EVIDENCE_TYPES = [
  "PHOTOGRAPHIC",
  "RADAR",
  "PHYSICAL_DEBRIS",
  "BIOLOGICAL_SAMPLE",
  "AUDIO",
] as const;
export const STORAGE_LOCATIONS = ["QUANTICO_LAB", "HANGAR_18", "FIELD_OFFICE_SAFE"] as const;
export const ENCOUNTER_CLASSES = ["CE1", "CE2", "CE3", "CE4"] as const;
export const MEDICAL_EVALUATIONS = ["SCHEDULED", "COMPLETED", "DECLINED"] as const;
export const THREAT_LEVELS = ["NONE", "LOW", "MODERATE", "HIGH"] as const;
export const CLASSIFICATION_LEVELS = [
  "UNCLASSIFIED",
  "CONFIDENTIAL",
  "SECRET",
  "TOP_SECRET",
] as const;

export type FieldOffice = (typeof FIELD_OFFICES)[number];
export type ObjectShape = (typeof OBJECT_SHAPES)[number];
export type ObjectCount = (typeof OBJECT_COUNTS)[number];
export type ObservationDuration = (typeof OBSERVATION_DURATIONS)[number];
export type EstimatedAltitude = (typeof ESTIMATED_ALTITUDES)[number];
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
export type StorageLocation = (typeof STORAGE_LOCATIONS)[number];
export type EncounterClass = (typeof ENCOUNTER_CLASSES)[number];
export type MedicalEvaluation = (typeof MEDICAL_EVALUATIONS)[number];
export type ThreatLevel = (typeof THREAT_LEVELS)[number];
export type ClassificationLevel = (typeof CLASSIFICATION_LEVELS)[number];

// ------------------------------------------------------------------ draft --

/**
 * The shape the form edits and the browser posts: every control contributes a
 * string, an array or a boolean, and nothing is null or undefined. The
 * defaults matter on the server, where a body that omits a key should produce
 * "Narrative is required" rather than zod's own "Required".
 */
export const uapReportDraftSchema = z.object({
  caseNumber: z.string().default(""),
  reportingAgentName: z.string().default(""),
  badgeNumber: z.string().default(""),
  fieldOffice: z.string().default(""),
  sightingDate: z.string().default(""),
  reportFiledDate: z.string().default(""),
  sightingLocation: z.string().default(""),
  objectShape: z.string().default(""),
  objectShapeOther: z.string().default(""),
  objectCount: z.string().default(""),
  observationDuration: z.string().default(""),
  estimatedAltitude: z.string().default(""),
  narrative: z.string().default(""),
  evidenceCollected: z.array(z.string()).default([]),
  debrisCustodyChain: z.string().default(""),
  debrisStorageLocation: z.string().default(""),
  mediaReferenceIds: z.string().default(""),
  civilianWitnesses: z.boolean().default(false),
  witnessCount: z.string().default(""),
  witnessStatement: z.string().default(""),
  encounterClass: z.string().default(""),
  physicalEffects: z.string().default(""),
  occupantDescription: z.string().default(""),
  missingTimeMinutes: z.string().default(""),
  medicalEvaluation: z.string().default(""),
  threatAssessment: z.string().default(""),
  escalationJustification: z.string().default(""),
  classificationLevel: z.string().default(""),
  notifyBureauLeadership: z.boolean().default(false),
  additionalRemarks: z.string().default(""),
  certified: z.boolean().default(false),
});

export type UapReportDraft = z.infer<typeof uapReportDraftSchema>;
export type UapFieldName = keyof UapReportDraft;

export const emptyUapReportDraft: UapReportDraft = uapReportDraftSchema.parse({});

export const UAP_FIELD_NAMES = Object.keys(emptyUapReportDraft) as UapFieldName[];

// ------------------------------------------------------ conditional logic --

type Predicate = (draft: UapReportDraft) => boolean;

const hasCustodyEvidence: Predicate = (draft) =>
  draft.evidenceCollected.includes("PHYSICAL_DEBRIS") ||
  draft.evidenceCollected.includes("BIOLOGICAL_SAMPLE");

/**
 * The single definition of conditional visibility. Called from the form, to
 * decide what to render, and from the schema below, to decide what to demand.
 * There is no second copy anywhere.
 */
const VISIBLE_WHEN: Partial<Record<UapFieldName, Predicate>> = {
  objectShapeOther: (draft) => draft.objectShape === "OTHER",
  debrisCustodyChain: hasCustodyEvidence,
  debrisStorageLocation: hasCustodyEvidence,
  mediaReferenceIds: (draft) =>
    draft.evidenceCollected.includes("PHOTOGRAPHIC") ||
    draft.evidenceCollected.includes("AUDIO"),
  witnessCount: (draft) => draft.civilianWitnesses,
  witnessStatement: (draft) => draft.civilianWitnesses,
  occupantDescription: (draft) =>
    draft.encounterClass === "CE3" || draft.encounterClass === "CE4",
  missingTimeMinutes: (draft) => draft.encounterClass === "CE4",
  medicalEvaluation: (draft) => draft.encounterClass === "CE4",
  escalationJustification: (draft) => draft.threatAssessment === "HIGH",
};

const NEVER: Predicate = () => false;

const REQUIRED_WHEN: Partial<Record<UapFieldName, Predicate>> = {
  estimatedAltitude: NEVER,
  evidenceCollected: NEVER,
  mediaReferenceIds: NEVER,
  civilianWitnesses: NEVER,
  notifyBureauLeadership: NEVER,
  additionalRemarks: NEVER,
  // The one field whose requiredness follows another answer: a CE-1 report
  // may leave it blank, anything above CE-1 may not.
  physicalEffects: (draft) => draft.encounterClass !== "" && draft.encounterClass !== "CE1",
};

export function isApplicable(field: UapFieldName, draft: UapReportDraft): boolean {
  const condition = VISIBLE_WHEN[field];
  return condition ? condition(draft) : true;
}

export function isRequired(field: UapFieldName, draft: UapReportDraft): boolean {
  if (!isApplicable(field, draft)) return false;
  const condition = REQUIRED_WHEN[field];
  return condition ? condition(draft) : true;
}

/**
 * A field that stops applying loses its value immediately, so the form runs
 * every change through here rather than clearing by hand in each handler.
 */
export function clearInapplicable(draft: UapReportDraft): UapReportDraft {
  const next = { ...draft };
  for (const field of UAP_FIELD_NAMES) {
    if (isApplicable(field, draft)) continue;
    const blank = emptyUapReportDraft[field];
    (next as Record<string, unknown>)[field] = Array.isArray(blank) ? [] : blank;
  }
  return next;
}

/** What the browser posts: inapplicable fields are left out entirely. */
export function toSubmission(draft: UapReportDraft): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of UAP_FIELD_NAMES) {
    if (isApplicable(field, draft)) body[field] = draft[field];
  }
  return body;
}

// ----------------------------------------------------------------- labels --

export const UAP_LABELS: Record<UapFieldName, string> = {
  caseNumber: "Case number",
  reportingAgentName: "Reporting agent",
  badgeNumber: "Badge number",
  fieldOffice: "Field office",
  sightingDate: "Sighting date",
  reportFiledDate: "Report date",
  sightingLocation: "Sighting location",
  objectShape: "Object shape",
  objectShapeOther: "Describe the shape",
  objectCount: "Number of objects",
  observationDuration: "Duration of observation",
  estimatedAltitude: "Estimated altitude",
  narrative: "Narrative",
  evidenceCollected: "Evidence collected",
  debrisCustodyChain: "Custody chain",
  debrisStorageLocation: "Storage location",
  mediaReferenceIds: "Media reference ids",
  civilianWitnesses: "Civilian witnesses",
  witnessCount: "Witness count",
  witnessStatement: "Witness statement",
  encounterClass: "Encounter classification",
  physicalEffects: "Physical effects observed",
  occupantDescription: "Occupant description",
  missingTimeMinutes: "Missing time",
  medicalEvaluation: "Medical evaluation",
  threatAssessment: "Threat assessment",
  escalationJustification: "Escalation justification",
  classificationLevel: "Classification level",
  notifyBureauLeadership: "Notify Bureau leadership",
  additionalRemarks: "Additional remarks",
  certified: "Certification",
};

export const UAP_OPTION_LABELS: Record<string, string> = {
  ALBUQUERQUE: "Albuquerque",
  ANCHORAGE: "Anchorage",
  LAS_VEGAS: "Las Vegas",
  LOS_ANGELES: "Los Angeles",
  ROSWELL: "Roswell",
  SEATTLE: "Seattle",
  WASHINGTON_DC: "Washington, D.C.",
  DISC: "Disc",
  TRIANGLE: "Triangle",
  CIGAR: "Cigar",
  ORB: "Orb",
  TIC_TAC: "Tic-Tac",
  OTHER: "Other",
  ONE: "1",
  TWO_TO_FIVE: "2–5",
  SIX_TO_TWENTY: "6–20",
  TOO_MANY: "Too many to count",
  UNDER_1_MIN: "Under a minute",
  ONE_TO_5_MIN: "1–5 minutes",
  FIVE_TO_30_MIN: "5–30 minutes",
  OVER_30_MIN: "Over 30 minutes",
  TREETOP: "Treetop level",
  BELOW_CLOUD: "Below cloud base",
  ABOVE_CLOUD: "Above cloud base",
  ORBITAL: "Orbital",
  UNKNOWN: "Unknown",
  PHOTOGRAPHIC: "Photographic",
  RADAR: "Radar",
  PHYSICAL_DEBRIS: "Physical debris",
  BIOLOGICAL_SAMPLE: "Biological sample",
  AUDIO: "Audio recording",
  QUANTICO_LAB: "Quantico forensics lab",
  HANGAR_18: "Hangar 18",
  FIELD_OFFICE_SAFE: "Field office evidence safe",
  CE1: "CE-1 — sighting only",
  CE2: "CE-2 — physical effect observed",
  CE3: "CE-3 — occupant observed",
  CE4: "CE-4 — claimed interaction",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  DECLINED: "Declined by agent",
  NONE: "None",
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  UNCLASSIFIED: "Unclassified",
  CONFIDENTIAL: "Confidential",
  SECRET: "Secret",
  TOP_SECRET: "Top Secret",
};

// ------------------------------------------------------------- field rules --

const CASE_NUMBER_PATTERN = /^UAP-\d{4}-\d{4}$/;

/** Text fields and their maximum. The minimum is 3 when the field is
 *  currently required and 0 when it is not, so one table covers 3–255,
 *  0–255, 3–1000 and 0–1000. `caseNumber` is absent: its pattern fixes its
 *  length, so no band applies to it. */
const TEXT_FIELDS: ReadonlyArray<readonly [UapFieldName, 255 | 1000]> = [
  ["reportingAgentName", 255],
  ["badgeNumber", 255],
  ["sightingLocation", 255],
  ["objectShapeOther", 255],
  ["debrisCustodyChain", 255],
  ["mediaReferenceIds", 255],
  ["narrative", 1000],
  ["witnessStatement", 1000],
  ["physicalEffects", 1000],
  ["occupantDescription", 1000],
  ["escalationJustification", 1000],
  ["additionalRemarks", 1000],
];

const CHOICE_FIELDS: ReadonlyArray<readonly [UapFieldName, readonly string[], string]> = [
  ["fieldOffice", FIELD_OFFICES, "Select a field office."],
  ["objectShape", OBJECT_SHAPES, "Select an object shape."],
  ["objectCount", OBJECT_COUNTS, "Select how many objects were seen."],
  ["observationDuration", OBSERVATION_DURATIONS, "Select how long the observation lasted."],
  ["estimatedAltitude", ESTIMATED_ALTITUDES, "Select an estimated altitude."],
  ["debrisStorageLocation", STORAGE_LOCATIONS, "Select a storage location."],
  ["encounterClass", ENCOUNTER_CLASSES, "Choose an encounter classification."],
  ["medicalEvaluation", MEDICAL_EVALUATIONS, "Choose a medical evaluation status."],
  ["threatAssessment", THREAT_LEVELS, "Choose a threat assessment."],
  ["classificationLevel", CLASSIFICATION_LEVELS, "Select a classification level."],
];

const INTEGER_FIELDS: ReadonlyArray<readonly [UapFieldName, number, number]> = [
  ["witnessCount", 1, 999],
  ["missingTimeMinutes", 1, 10080],
];

/** Length is counted after trimming, in code points rather than UTF-16 units,
 *  so an emoji is one character and three spaces are none. */
const countCharacters = (value: string) => [...value].length;

const isRealIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

/** Today in UTC, so the two tiers agree on what "in the future" means
 *  regardless of where the browser is sitting. */
export const isoToday = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------ the schema ---

const text = (draft: UapReportDraft, field: UapFieldName) => (draft[field] as string).trim();

function addIssue(ctx: z.RefinementCtx, field: UapFieldName, message: string) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
}

function checkDate(ctx: z.RefinementCtx, draft: UapReportDraft, field: UapFieldName) {
  const value = text(draft, field);
  const label = UAP_LABELS[field];
  if (value === "") {
    addIssue(ctx, field, `${label} is required.`);
    return false;
  }
  if (!isRealIsoDate(value)) {
    addIssue(ctx, field, "Enter a valid date in YYYY-MM-DD format.");
    return false;
  }
  if (value > isoToday()) {
    addIssue(ctx, field, `${label} cannot be in the future.`);
    return false;
  }
  return true;
}

export const uapReportSchema = uapReportDraftSchema
  .superRefine((draft, ctx) => {
    const caseNumber = text(draft, "caseNumber");
    if (caseNumber === "") {
      addIssue(ctx, "caseNumber", `${UAP_LABELS.caseNumber} is required.`);
    } else if (!CASE_NUMBER_PATTERN.test(caseNumber)) {
      addIssue(ctx, "caseNumber", "Case number must look like UAP-2026-0042.");
    }

    for (const [field, max] of TEXT_FIELDS) {
      if (!isApplicable(field, draft)) continue;
      const value = text(draft, field);
      const label = UAP_LABELS[field];
      const required = isRequired(field, draft);
      if (value === "") {
        if (required) addIssue(ctx, field, `${label} is required.`);
        continue;
      }
      const length = countCharacters(value);
      if (required && length < 3) {
        addIssue(ctx, field, `${label} must be at least 3 characters.`);
      }
      if (length > max) {
        addIssue(ctx, field, `${label} must be at most ${max} characters (currently ${length}).`);
      }
    }

    for (const [field, options, prompt] of CHOICE_FIELDS) {
      if (!isApplicable(field, draft)) continue;
      const value = text(draft, field);
      if (value === "") {
        if (isRequired(field, draft)) addIssue(ctx, field, prompt);
        continue;
      }
      if (!options.includes(value)) addIssue(ctx, field, prompt);
    }

    for (const [field, min, max] of INTEGER_FIELDS) {
      if (!isApplicable(field, draft)) continue;
      const value = text(draft, field);
      const label = UAP_LABELS[field];
      if (value === "") {
        if (isRequired(field, draft)) addIssue(ctx, field, `${label} is required.`);
        continue;
      }
      const range = `${label} must be a whole number between ${min} and ${max}.`;
      if (!/^\d+$/.test(value)) {
        addIssue(ctx, field, range);
        continue;
      }
      const parsed = Number(value);
      if (parsed < min || parsed > max) addIssue(ctx, field, range);
    }

    const sightingOk = checkDate(ctx, draft, "sightingDate");
    const filedOk = checkDate(ctx, draft, "reportFiledDate");
    // Reported against the later field, because that is the one to change.
    if (sightingOk && filedOk && text(draft, "reportFiledDate") < text(draft, "sightingDate")) {
      addIssue(
        ctx,
        "reportFiledDate",
        "The report date cannot be earlier than the sighting date.",
      );
    }

    if (!draft.certified) {
      addIssue(ctx, "certified", "You must certify the report before filing it.");
    }
  })
  .transform((draft): UapReportValues => {
    const stored = (field: UapFieldName) =>
      isApplicable(field, draft) && text(draft, field) !== "" ? text(draft, field) : null;
    const storedNumber = (field: UapFieldName) => {
      const value = stored(field);
      return value === null ? null : Number(value);
    };

    return {
      caseNumber: text(draft, "caseNumber"),
      reportingAgentName: text(draft, "reportingAgentName"),
      badgeNumber: text(draft, "badgeNumber"),
      fieldOffice: text(draft, "fieldOffice") as FieldOffice,
      sightingDate: text(draft, "sightingDate"),
      reportFiledDate: text(draft, "reportFiledDate"),
      sightingLocation: text(draft, "sightingLocation"),
      objectShape: text(draft, "objectShape") as ObjectShape,
      objectShapeOther: stored("objectShapeOther"),
      objectCount: text(draft, "objectCount") as ObjectCount,
      observationDuration: text(draft, "observationDuration") as ObservationDuration,
      estimatedAltitude: stored("estimatedAltitude") as EstimatedAltitude | null,
      narrative: text(draft, "narrative"),
      evidenceCollected: draft.evidenceCollected.filter(
        (value, index, all): value is EvidenceType =>
          (EVIDENCE_TYPES as readonly string[]).includes(value) && all.indexOf(value) === index,
      ),
      debrisCustodyChain: stored("debrisCustodyChain"),
      debrisStorageLocation: stored("debrisStorageLocation") as StorageLocation | null,
      mediaReferenceIds: stored("mediaReferenceIds"),
      civilianWitnesses: draft.civilianWitnesses,
      witnessCount: storedNumber("witnessCount"),
      witnessStatement: stored("witnessStatement"),
      encounterClass: text(draft, "encounterClass") as EncounterClass,
      physicalEffects: stored("physicalEffects"),
      occupantDescription: stored("occupantDescription"),
      missingTimeMinutes: storedNumber("missingTimeMinutes"),
      medicalEvaluation: stored("medicalEvaluation") as MedicalEvaluation | null,
      threatAssessment: text(draft, "threatAssessment") as ThreatLevel,
      escalationJustification: stored("escalationJustification"),
      classificationLevel: text(draft, "classificationLevel") as ClassificationLevel,
      notifyBureauLeadership: draft.notifyBureauLeadership,
      additionalRemarks: stored("additionalRemarks"),
      certified: draft.certified,
    };
  });

export interface UapReportValues {
  caseNumber: string;
  reportingAgentName: string;
  badgeNumber: string;
  fieldOffice: FieldOffice;
  sightingDate: string;
  reportFiledDate: string;
  sightingLocation: string;
  objectShape: ObjectShape;
  objectShapeOther: string | null;
  objectCount: ObjectCount;
  observationDuration: ObservationDuration;
  estimatedAltitude: EstimatedAltitude | null;
  narrative: string;
  evidenceCollected: EvidenceType[];
  debrisCustodyChain: string | null;
  debrisStorageLocation: StorageLocation | null;
  mediaReferenceIds: string | null;
  civilianWitnesses: boolean;
  witnessCount: number | null;
  witnessStatement: string | null;
  encounterClass: EncounterClass;
  physicalEffects: string | null;
  occupantDescription: string | null;
  missingTimeMinutes: number | null;
  medicalEvaluation: MedicalEvaluation | null;
  threatAssessment: ThreatLevel;
  escalationJustification: string | null;
  classificationLevel: ClassificationLevel;
  notifyBureauLeadership: boolean;
  additionalRemarks: string | null;
  certified: boolean;
}

// ----------------------------------------------------------------- errors --

/**
 * The error envelope both tiers render. The API's validation pipe and the
 * browser share it so a locally-caught failure and a 400 look identical.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export type UapValidationResult =
  | { ok: true; value: UapReportValues }
  | { ok: false; fieldErrors: Record<string, string[]> };

/** What the form calls before it touches the network. */
export function validateUapDraft(draft: UapReportDraft): UapValidationResult {
  const result = uapReportSchema.safeParse(draft);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, fieldErrors: toFieldErrors(result.error) };
}
