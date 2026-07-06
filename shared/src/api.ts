export interface DirectoryEntry {
  operatorName: string;
  activity: string;
  meetingPointName: string;
  demandCount: number;
  optedIn: boolean;
  lastDemandAt: string;
}

export interface FixtureRef {
  slug: string;
  url: string;
}
