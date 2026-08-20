"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CLASSIFICATION_LEVELS,
  clearInapplicable,
  ENCOUNTER_CLASSES,
  ESTIMATED_ALTITUDES,
  EVIDENCE_TYPES,
  FIELD_OFFICES,
  isApplicable,
  isRequired,
  MEDICAL_EVALUATIONS,
  OBJECT_COUNTS,
  OBJECT_SHAPES,
  OBSERVATION_DURATIONS,
  STORAGE_LOCATIONS,
  THREAT_LEVELS,
  toSubmission,
  UAP_FIELD_NAMES,
  UAP_LABELS,
  UAP_OPTION_LABELS,
  validateUapDraft,
  type UapFieldName,
  type UapReportDraft,
} from "@school/shared";
import { apiFetch, ApiError } from "../../lib/api";
import type { FieldErrors, UapReport } from "../../lib/types";
import { CheckboxField } from "../CheckboxField";
import { CheckboxGroupField } from "../CheckboxGroupField";
import { DateField } from "../DateField";
import { Field } from "../Field";
import { focusField } from "../FieldShell";
import { FormErrors } from "../FormErrors";
import { RadioGroupField } from "../RadioGroupField";
import { SelectField } from "../SelectField";
import { TextareaField } from "../TextareaField";
import { ValidationSummary } from "./ValidationSummary";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-2">
      <h2 className="mb-3 mt-8 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Files a new report, or amends one that already exists when given its id.
 * The two differ only in where the draft starts and which request saves it —
 * every rule, every message and every conditional field behaves identically,
 * because an amendment has to satisfy what a first filing satisfied.
 */
export function UapReportForm({
  initialDraft,
  reportId,
}: {
  initialDraft: UapReportDraft;
  reportId?: string;
}) {
  const router = useRouter();
  const amending = reportId !== undefined;
  const [draft, setDraft] = useState<UapReportDraft>(initialDraft);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /**
   * Which fields have been reported invalid at least once. Before the first
   * submission this is empty and the form stays quiet; afterwards, only the
   * fields in it re-check themselves as they are edited. A field that was
   * valid when the form was submitted keeps its peace until the next attempt,
   * rather than turning red while someone is still typing into it.
   */
  const [reported, setReported] = useState<ReadonlySet<string>>(new Set());

  function update(field: UapFieldName, value: string | string[] | boolean) {
    // One place clears the fields a changed answer has just hidden, so no
    // handler can forget to.
    const next = clearInapplicable({ ...draft, [field]: value } as UapReportDraft);
    setDraft(next);
    if (reported.size === 0) return;
    const result = validateUapDraft(next);
    const all = result.ok ? {} : result.fieldErrors;
    const shown: FieldErrors = {};
    for (const name of Object.keys(all)) {
      if (reported.has(name)) shown[name] = all[name];
    }
    setFieldErrors(shown);
  }

  function reject(errors: FieldErrors) {
    setFieldErrors(errors);
    setReported((previous) => new Set([...previous, ...Object.keys(errors)]));
    const first = UAP_FIELD_NAMES.find((field) => errors[field]?.length);
    if (first) focusField(first);
    document.getElementById("validation-summary")?.scrollIntoView({ block: "center" });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    // Validated here first, so an invalid form never reaches the network.
    const result = validateUapDraft(draft);
    if (!result.ok) {
      reject(result.fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const report = await apiFetch<UapReport>(
        amending ? `/reports/uap/${reportId}` : "/reports/uap",
        {
          method: amending ? "PATCH" : "POST",
          body: JSON.stringify(toSubmission(draft)),
        },
      );
      router.push(`/reports/uap/${report.id}?${amending ? "saved" : "filed"}=1`);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        // A rule the browser did not catch, or a case number claimed while
        // this one was being filled in. Same display, same focus.
        const errors = error.fieldErrors ?? {};
        if (Object.keys(errors).length > 0) reject(errors);
        else setFieldErrors({});
      } else {
        setMessage("Something went wrong");
      }
      setSubmitting(false);
    }
  }

  const errors = (field: UapFieldName) => fieldErrors[field];
  const required = (field: UapFieldName) => isRequired(field, draft);
  const shows = (field: UapFieldName) => isApplicable(field, draft);
  const text = (field: UapFieldName) => draft[field] as string;
  const onText = (field: UapFieldName) => (value: string) => update(field, value);

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormErrors message={message} />
      <ValidationSummary
        fieldErrors={fieldErrors}
        labels={UAP_LABELS}
        order={UAP_FIELD_NAMES}
        lead={amending ? "Your changes were not saved." : "This report was not filed."}
      />

      <Section title="Case identification">
        <Field
          id="caseNumber"
          label={UAP_LABELS.caseNumber}
          value={text("caseNumber")}
          onChange={onText("caseNumber")}
          errors={errors("caseNumber")}
          required={required("caseNumber")}
          placeholder="UAP-2026-0042"
        />
        <Field
          id="reportingAgentName"
          label={UAP_LABELS.reportingAgentName}
          value={text("reportingAgentName")}
          onChange={onText("reportingAgentName")}
          errors={errors("reportingAgentName")}
          required={required("reportingAgentName")}
        />
        <Field
          id="badgeNumber"
          label={UAP_LABELS.badgeNumber}
          value={text("badgeNumber")}
          onChange={onText("badgeNumber")}
          errors={errors("badgeNumber")}
          required={required("badgeNumber")}
        />
        <SelectField
          id="fieldOffice"
          label={UAP_LABELS.fieldOffice}
          value={text("fieldOffice")}
          onChange={onText("fieldOffice")}
          options={FIELD_OFFICES}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("fieldOffice")}
          required={required("fieldOffice")}
        />
        <DateField
          id="sightingDate"
          label={UAP_LABELS.sightingDate}
          value={text("sightingDate")}
          onChange={onText("sightingDate")}
          errors={errors("sightingDate")}
          required={required("sightingDate")}
        />
        <DateField
          id="reportFiledDate"
          label={UAP_LABELS.reportFiledDate}
          value={text("reportFiledDate")}
          onChange={onText("reportFiledDate")}
          errors={errors("reportFiledDate")}
          required={required("reportFiledDate")}
        />
      </Section>

      <Section title="The object">
        <Field
          id="sightingLocation"
          label={UAP_LABELS.sightingLocation}
          value={text("sightingLocation")}
          onChange={onText("sightingLocation")}
          errors={errors("sightingLocation")}
          required={required("sightingLocation")}
          placeholder="Nearest town, landmark or coordinates"
        />
        <SelectField
          id="objectShape"
          label={UAP_LABELS.objectShape}
          value={text("objectShape")}
          onChange={onText("objectShape")}
          options={OBJECT_SHAPES}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("objectShape")}
          required={required("objectShape")}
        />
        {shows("objectShapeOther") && (
          <Field
            id="objectShapeOther"
            label={UAP_LABELS.objectShapeOther}
            value={text("objectShapeOther")}
            onChange={onText("objectShapeOther")}
            errors={errors("objectShapeOther")}
            required={required("objectShapeOther")}
          />
        )}
        <SelectField
          id="objectCount"
          label={UAP_LABELS.objectCount}
          value={text("objectCount")}
          onChange={onText("objectCount")}
          options={OBJECT_COUNTS}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("objectCount")}
          required={required("objectCount")}
        />
        <SelectField
          id="observationDuration"
          label={UAP_LABELS.observationDuration}
          value={text("observationDuration")}
          onChange={onText("observationDuration")}
          options={OBSERVATION_DURATIONS}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("observationDuration")}
          required={required("observationDuration")}
        />
        <SelectField
          id="estimatedAltitude"
          label={UAP_LABELS.estimatedAltitude}
          value={text("estimatedAltitude")}
          onChange={onText("estimatedAltitude")}
          options={ESTIMATED_ALTITUDES}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("estimatedAltitude")}
          required={required("estimatedAltitude")}
        />
        <TextareaField
          id="narrative"
          label={UAP_LABELS.narrative}
          value={text("narrative")}
          onChange={onText("narrative")}
          max={1000}
          rows={6}
          errors={errors("narrative")}
          required={required("narrative")}
          placeholder="What you observed, in your own words"
        />
      </Section>

      <Section title="Witnesses and evidence">
        <CheckboxGroupField
          name="evidenceCollected"
          legend={UAP_LABELS.evidenceCollected}
          values={draft.evidenceCollected}
          onChange={(values) => update("evidenceCollected", values)}
          options={EVIDENCE_TYPES}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("evidenceCollected")}
        />
        {shows("debrisCustodyChain") && (
          <Field
            id="debrisCustodyChain"
            label={UAP_LABELS.debrisCustodyChain}
            value={text("debrisCustodyChain")}
            onChange={onText("debrisCustodyChain")}
            errors={errors("debrisCustodyChain")}
            required={required("debrisCustodyChain")}
            placeholder="Who recovered it, when, and who holds it now"
          />
        )}
        {shows("debrisStorageLocation") && (
          <SelectField
            id="debrisStorageLocation"
            label={UAP_LABELS.debrisStorageLocation}
            value={text("debrisStorageLocation")}
            onChange={onText("debrisStorageLocation")}
            options={STORAGE_LOCATIONS}
            optionLabels={UAP_OPTION_LABELS}
            errors={errors("debrisStorageLocation")}
            required={required("debrisStorageLocation")}
          />
        )}
        {shows("mediaReferenceIds") && (
          <Field
            id="mediaReferenceIds"
            label={UAP_LABELS.mediaReferenceIds}
            value={text("mediaReferenceIds")}
            onChange={onText("mediaReferenceIds")}
            errors={errors("mediaReferenceIds")}
            required={required("mediaReferenceIds")}
            placeholder="IMG-4471, AUD-0093"
          />
        )}
        <CheckboxField
          id="civilianWitnesses"
          label="Civilian witnesses were present"
          checked={draft.civilianWitnesses}
          onChange={(checked) => update("civilianWitnesses", checked)}
          errors={errors("civilianWitnesses")}
        />
        {shows("witnessCount") && (
          <Field
            id="witnessCount"
            label={UAP_LABELS.witnessCount}
            value={text("witnessCount")}
            onChange={onText("witnessCount")}
            errors={errors("witnessCount")}
            required={required("witnessCount")}
            inputMode="numeric"
          />
        )}
        {shows("witnessStatement") && (
          <TextareaField
            id="witnessStatement"
            label={UAP_LABELS.witnessStatement}
            value={text("witnessStatement")}
            onChange={onText("witnessStatement")}
            max={1000}
            errors={errors("witnessStatement")}
            required={required("witnessStatement")}
          />
        )}
      </Section>

      <Section title="Encounter classification">
        <RadioGroupField
          name="encounterClass"
          legend={UAP_LABELS.encounterClass}
          value={text("encounterClass")}
          onChange={onText("encounterClass")}
          options={ENCOUNTER_CLASSES}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("encounterClass")}
          required={required("encounterClass")}
        />
        <TextareaField
          id="physicalEffects"
          label={UAP_LABELS.physicalEffects}
          value={text("physicalEffects")}
          onChange={onText("physicalEffects")}
          max={1000}
          errors={errors("physicalEffects")}
          required={required("physicalEffects")}
        />
        {shows("occupantDescription") && (
          <TextareaField
            id="occupantDescription"
            label={UAP_LABELS.occupantDescription}
            value={text("occupantDescription")}
            onChange={onText("occupantDescription")}
            max={1000}
            errors={errors("occupantDescription")}
            required={required("occupantDescription")}
          />
        )}
        {shows("missingTimeMinutes") && (
          <Field
            id="missingTimeMinutes"
            label={`${UAP_LABELS.missingTimeMinutes} (minutes)`}
            value={text("missingTimeMinutes")}
            onChange={onText("missingTimeMinutes")}
            errors={errors("missingTimeMinutes")}
            required={required("missingTimeMinutes")}
            inputMode="numeric"
          />
        )}
        {shows("medicalEvaluation") && (
          <RadioGroupField
            name="medicalEvaluation"
            legend={UAP_LABELS.medicalEvaluation}
            value={text("medicalEvaluation")}
            onChange={onText("medicalEvaluation")}
            options={MEDICAL_EVALUATIONS}
            optionLabels={UAP_OPTION_LABELS}
            errors={errors("medicalEvaluation")}
            required={required("medicalEvaluation")}
          />
        )}
      </Section>

      <Section title="Disposition">
        <RadioGroupField
          name="threatAssessment"
          legend={UAP_LABELS.threatAssessment}
          value={text("threatAssessment")}
          onChange={onText("threatAssessment")}
          options={THREAT_LEVELS}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("threatAssessment")}
          required={required("threatAssessment")}
        />
        {shows("escalationJustification") && (
          <TextareaField
            id="escalationJustification"
            label={UAP_LABELS.escalationJustification}
            value={text("escalationJustification")}
            onChange={onText("escalationJustification")}
            max={1000}
            errors={errors("escalationJustification")}
            required={required("escalationJustification")}
          />
        )}
        <SelectField
          id="classificationLevel"
          label={UAP_LABELS.classificationLevel}
          value={text("classificationLevel")}
          onChange={onText("classificationLevel")}
          options={CLASSIFICATION_LEVELS}
          optionLabels={UAP_OPTION_LABELS}
          errors={errors("classificationLevel")}
          required={required("classificationLevel")}
        />
        <CheckboxField
          id="notifyBureauLeadership"
          label="Notify Bureau leadership"
          checked={draft.notifyBureauLeadership}
          onChange={(checked) => update("notifyBureauLeadership", checked)}
          errors={errors("notifyBureauLeadership")}
        />
        <TextareaField
          id="additionalRemarks"
          label={UAP_LABELS.additionalRemarks}
          value={text("additionalRemarks")}
          onChange={onText("additionalRemarks")}
          max={1000}
          errors={errors("additionalRemarks")}
          required={required("additionalRemarks")}
        />
        <CheckboxField
          id="certified"
          label="I certify that this report is accurate to the best of my knowledge"
          checked={draft.certified}
          onChange={(checked) => update("certified", checked)}
          errors={errors("certified")}
        />
      </Section>

      {/* Never disabled for being invalid — a disabled button explains
          nothing. Only while a request is in flight. */}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? amending
            ? "Saving…"
            : "Filing…"
          : amending
            ? "Save changes"
            : "File report"}
      </button>
    </form>
  );
}
