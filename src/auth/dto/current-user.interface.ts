import { Types } from 'mongoose';

export interface ICurrentUser {
  id?: Types.ObjectId;

  fullName: string;

  email: string;
}
