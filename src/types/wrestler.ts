export interface Wrestler {
  id: number;
  name: string;
  classYear?: string;
  primaryWeightClass?: string;
  active: boolean;
  record?: string;
  userId?: string | null;
}
