export class User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  createdAt: number;

  constructor(obj?: any) {
    this.uid = obj ? obj.uid : '';
    this.email = obj ? obj.email : '';
    this.displayName = obj ? obj.displayName : '';
    this.photoURL = obj ? obj.photoURL : './../../../assets/images/blank_user.svg';
    this.emailVerified = obj ? obj.emailVerified : '';
    this.isAnonymous = obj ? obj.isAnonymous : '';
    this.createdAt = obj ? obj.metadata.createdAt : '';
  }

  /**
   * Converts a user object into a JSON
   * @returns JSON
   */
  public userToJSON() {
    return {
      uid: this.uid,
      email: this.email || '',
      displayName: this.displayName,
      photoURL: this.photoURL || './../../../assets/images/blank_user.svg',
      emailVerified: this.emailVerified,
      isAnonymous: this.isAnonymous,
      createdAt: this.createdAt,
    };
  }
}
