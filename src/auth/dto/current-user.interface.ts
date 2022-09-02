import * as bson from 'bson';

export interface ICurrentUser {
  id?: bson.ObjectID;

  fullName: string;

  email: string;
}
