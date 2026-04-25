export type Department = 'DASHBOARD' | 'X-RAY 14x17' | 'X-RAY 11x14' | 'OPG' | 'CT-SCAN' | 'FILM SUMMARY' | 'FILM SUMMARY 14x17' | 'FILM SUMMARY 11x14' | 'DATA MANAGEMENT' | 'RADIOGRAPHERS' | 'SYSTEM SETTINGS' | 'SYSTEM SETTINGS GENERAL' | 'SYSTEM SETTINGS HOSPITAL';

export interface PatientRecord {
  id: string;
  date: string;
  name: string;
  age: string;
  invoice: string;
  filmType: string;
  count: number;
  radiographer: string;
  department: Department;
}

export interface FilmStockDaily {
  date: string;
  bf: number;
  receive: number;
  use: number;
  waste: number;
  balance: number;
}

export interface Radiographer {
  id: string;
  name: string;
  username: string;
  phone: string;
  specialization: string;
  role: 'admin' | 'radiographer';
  isActive: boolean;
  createdAt: number;
}
