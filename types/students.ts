export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  class: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
