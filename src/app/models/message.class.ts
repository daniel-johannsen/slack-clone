export class Message {
  uid: string;
  displayName: string;
  photoURL: string;
  message: string;

  constructor(obj?: any) {
    this.uid = obj ? obj.uid : '';
    this.displayName = obj ? obj.displayName : 'Guest';
    this.photoURL = obj ? obj.photoURL : './../../../assets/images/blank_user.svg';
    this.message = obj ? obj.message : '';
  }

  /**
   * Converts a user object into a JSON
   * @returns JSON
   */
  public toJSON() {
    return {
      uid: this.uid,
      displayName: this.displayName,
      photoURL: this.photoURL || './../../../assets/images/blank_user.svg',
      message: this.message,
    };
  }
}
