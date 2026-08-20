import {
  ClassificationLevel,
  EncounterClass,
  EstimatedAltitude,
  EvidenceType,
  FieldOffice,
  MedicalEvaluation,
  ObjectCount,
  ObjectShape,
  ObservationDuration,
  StorageLocation,
  ThreatLevel,
} from "@prisma/client";

/**
 * Two filed reports for the admin account, so the list and the detail page
 * have something to show on a freshly seeded database. One of each extreme:
 * a CE-1 sighting that leaves every conditional field empty, and a CE-4
 * encounter that fills all ten of them.
 */

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const DEMO_UAP_REPORTS = [
  {
    id: "uap_roswell_0001",
    userId: "usr_admin",
    caseNumber: "UAP-2026-0001",
    reportingAgentName: "Avery Admin",
    badgeNumber: "JTT047101111",
    fieldOffice: FieldOffice.ROSWELL,
    sightingDate: day("2026-07-14"),
    reportFiledDate: day("2026-07-15"),
    sightingLocation: "Route 285, eleven miles north of Roswell",
    objectShape: ObjectShape.DISC,
    objectShapeOther: null,
    objectCount: ObjectCount.ONE,
    observationDuration: ObservationDuration.ONE_TO_5_MIN,
    estimatedAltitude: EstimatedAltitude.BELOW_CLOUD,
    narrative:
      "A metallic disc held station over the highway for roughly four minutes, " +
      "showed no lights and made no sound, then left northward at a speed I " +
      "could not estimate. No other traffic was on the road.",
    evidenceCollected: [],
    debrisCustodyChain: null,
    debrisStorageLocation: null,
    mediaReferenceIds: null,
    civilianWitnesses: false,
    witnessCount: null,
    witnessStatement: null,
    encounterClass: EncounterClass.CE1,
    physicalEffects: null,
    occupantDescription: null,
    missingTimeMinutes: null,
    medicalEvaluation: null,
    threatAssessment: ThreatLevel.NONE,
    escalationJustification: null,
    classificationLevel: ClassificationLevel.UNCLASSIFIED,
    notifyBureauLeadership: false,
    additionalRemarks: null,
    certified: true,
  },
  {
    id: "uap_vegas_0042",
    userId: "usr_admin",
    caseNumber: "UAP-2026-0042",
    reportingAgentName: "Avery Admin",
    badgeNumber: "JTT047101111",
    fieldOffice: FieldOffice.LAS_VEGAS,
    sightingDate: day("2026-08-02"),
    reportFiledDate: day("2026-08-03"),
    sightingLocation: "Dry lake bed, forty miles north-west of Las Vegas",
    objectShape: ObjectShape.OTHER,
    objectShapeOther: "A matte black chevron with no visible seams or panel lines",
    objectCount: ObjectCount.TWO_TO_FIVE,
    observationDuration: ObservationDuration.OVER_30_MIN,
    estimatedAltitude: EstimatedAltitude.TREETOP,
    narrative:
      "Three chevrons crossed the lake bed in formation at low altitude and " +
      "held position over the west shore for most of an hour. They made no " +
      "sound whatsoever, which is what the witnesses found hardest to accept.",
    evidenceCollected: [
      EvidenceType.PHOTOGRAPHIC,
      EvidenceType.RADAR,
      EvidenceType.PHYSICAL_DEBRIS,
      EvidenceType.AUDIO,
    ],
    debrisCustodyChain:
      "Recovered 03:14, sealed in evidence case 7, signed over to SA Mulder at 05:40",
    debrisStorageLocation: StorageLocation.HANGAR_18,
    mediaReferenceIds: "IMG-4471, IMG-4472, AUD-0093",
    civilianWitnesses: true,
    witnessCount: 3,
    witnessStatement:
      "Three campers described the same formation and the same silence. Two " +
      "of them independently drew the chevron before being shown anything.",
    encounterClass: EncounterClass.CE4,
    physicalEffects:
      "Vehicle electrics failed for the duration and the compass spun freely. " +
      "Both recovered the moment the objects left.",
    occupantDescription:
      "One figure, roughly four feet tall, seen against the underside light " +
      "for perhaps two seconds. No features I would swear to in a deposition.",
    missingTimeMinutes: 97,
    medicalEvaluation: MedicalEvaluation.SCHEDULED,
    threatAssessment: ThreatLevel.HIGH,
    escalationJustification:
      "Physical debris recovered, an occupant observed, and 97 minutes " +
      "unaccounted for by three separate witnesses and the reporting agent.",
    classificationLevel: ClassificationLevel.TOP_SECRET,
    notifyBureauLeadership: true,
    additionalRemarks:
      "The lake bed showed a shallow ring of vitrified sand roughly nine " +
      "metres across. Photographed but not sampled.",
    certified: true,
  },
];
