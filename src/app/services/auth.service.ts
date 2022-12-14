import { Injectable, Injector, NgZone } from '@angular/core';
import { User } from '../interfaces/user';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { FirestoreService } from './firestore.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogAuthErrorsComponent } from '../components/dialog-auth-errors/dialog-auth-errors.component';
import { FirestorageService } from './firestorage.service';
import { UtilsService } from './utils.service';
import { DialogAlreadyLoggedInComponent } from '../components/dialog-already-logged-in/dialog-already-logged-in.component';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  loginAsGuest: boolean = false;
  guestDisplayName: string = '';
  userData: any; // Save logged in user data
  newDisplayName: string = '';
  authErrorIcon: string = 'info';
  authErrorHeadline: string = '';
  authErrorUserMessage: string = '';
  authErrorMessage: string = '';
  authErrorCode: any = '';

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone, // NgZone service to remove outside scope warning
    private firestoreService: FirestoreService,
    private dialog: MatDialog,
    private injector: Injector,
    private utils: UtilsService
  ) {

    // Saving user data in localStorage when logged in and setting up null when logged out
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user')!);
      } else {
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
      }
    });
  }

  /**
   * Sign in with email/password
   * @param email
   * @param password
   * @returns
   */
  signIn(email: string, password: string) {
    this.utils.loading = true;

    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.setUserData(result.user);
        this.afAuth.authState.subscribe((user) => {

          // If user has verified his email, but the page is not reloaded, the login does not work
          if (user && user.emailVerified && this.router.url == '/login') {
            this.router.navigate(['chat/welcome']).then(() => {
              this.utils.loading = false;
              // window.location.reload(); => leading to 404 error
            });
          }

          if (user && user.emailVerified) {
            this.router.navigate(['chat/welcome']);
            this.utils.loading = false;
          } else {
            this.displayAuthErrorDialog('report', 'Attention', 'Please verify your email!', 'null', 'null');
            this.utils.loading = false;
          }
        });
      }).catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
  }

  /**
   * Sign up with email/password
   * @param displayName The name entered by the user
   * @param email The email address entered by the user
   * @param password The password entered by the user
   * @returns
   */
  signUp(displayName: string, email: string, password: string) {
    this.utils.loading = true;

    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        this.changeDisplayName(displayName);
        this.sendVerificationMail(); // Call the SendVerificationMail() function when new user sign up and returns promise
        this.setUserData(result.user);
        this.utils.loading = false;
      })
      .catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
  }

  /**
   * Send email verification when new user sign up
   * @returns
   */
  sendVerificationMail() {
    this.utils.loading = true;

    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email-address']);
        this.utils.loading = false;
      }).catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
  }

  /**
   * Reset forgot password
   * @param passwordResetEmail
   * @returns
   */
  forgotPassword(passwordResetEmail: string) {
    this.utils.loading = true;

    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        this.displayAuthErrorDialog('info', 'Info', 'Password reset email sent, check your inbox.', 'null', 'null');
        this.utils.loading = false;
      })
      .catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
  }

  /**
   * Returns true when user is logged in and email is verified, or if user is a guest
   */
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return (user !== null) && (this.checkEmailVerification() !== false) ? true : false;
  }

  /**
   * Checks if the user is a guest, if yes no email verification is needed
   * @returns true || false
   */
  checkEmailVerification() {
    const user = JSON.parse(localStorage.getItem('user')!);

    if (this.loginAsGuest) {
      return true;
    } else if (user.emailVerified) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Sign in with Google
   * @returns
   */
  googleAuth() {
    this.utils.loading = true;

    return this.authLogin(new auth.GoogleAuthProvider()).then(() => {
      // Cannot be forwarded immediately after authentication
      setTimeout(() => {
        this.router.navigate(['chat/welcome']);
        this.utils.loading = false;
      }, 1000);
    }).catch((error) => {
      this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
      this.utils.loading = false;
    });
  }

  /**
   * Auth logic to run auth providers
   * @param provider
   * @returns
   */
  authLogin(provider: any) {
    this.utils.loading = true;

    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.router.navigate(['chat/welcome']);
        this.setUserData(result.user);
        this.utils.loading = false;
      })
      .catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      })
  }

  /**
   * Setting up user data when sign in with username/password
   * sign up with username/password and sign in with social auth
   * provider in Firestore database using AngularFirestore + AngularFirestoreDocument service
   * @param user
   * @returns
   */
  setUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );

    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      createdAt: user.metadata.createdAt
    };

    return userRef.set(userData, {
      merge: true,
    });
  }

  /**
   * Log out
   * @returns
   */
  logOut() {
    this.utils.loading = true;

    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['login']).then(() => {
        window.location.reload();
        this.utils.loading = false;
      }).catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
    }).catch((error) => {
      this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
      this.utils.loading = false;
    });
  }

  /**
   * Creates an anonymous user account in Firebase Authentication and logs in the user
   * @param guestDisplayName The name of the guest user
   */
  guestLogin(guestDisplayName: string) {
    this.utils.loading = true;
    this.loginAsGuest = true;

    this.afAuth.signInAnonymously().then((result) => {
      this.setUserData(result.user);
      this.changeDisplayName(guestDisplayName);

      this.afAuth.onAuthStateChanged(() => {
        this.router.navigate(['chat/welcome']);
        this.utils.loading = false;
      });

    }).catch((error) => {
      this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
      this.utils.loading = false;
    })
  }


  /**
   * Checks if the user is already logged in
   * Displays a forwarding dialog after a short delay if the user is logged in
   */
  checkAlreadyLoggedIn() {
    this.afAuth.onAuthStateChanged((user) => {
      if (user && user.emailVerified && !user.isAnonymous && !this.utils.loading) {
        setTimeout(() => {
          this.openAlreadyLoggedInDialog();
        }, 1000);
      }
    });
  }


  /**
   * Changes the displayName of the currently logged in user
   * @param newName String with the new name
   */
  changeDisplayName(newName: string) {
    this.utils.loading = true;

    this.afAuth.currentUser.then((user) => {
      user.updateProfile({
        displayName: newName
      }).then(() => {
        this.firestoreService.updateUser(user.uid);
        this.utils.loading = false;
      }).catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
    }).catch((error) => {
      this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
      this.utils.loading = false;
    });
  }

  /**
   * Update the profile picture of the current user attached to the upload
   * @param photoURL The URL of the new img
   */
  changeProfilePicture(photoURL: string) {
    this.utils.loading = true;

    this.afAuth.currentUser.then((user) => {
      user.updateProfile({
        photoURL: photoURL
      }).then(() => {
        this.firestoreService.updateUser(user.uid);
        this.utils.loading = false;
      }).catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
    }).catch((error) => {
      this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
      this.utils.loading = false;
    });
  }

  /**
   * Deletes the currently logged in user
   */
  deleteUser() {
    this.utils.loading = true;
    // this.deleteProfilePicture(); => Can be used if wanted

    this.afAuth.currentUser.then((user) => {
      this.firestoreService.deleteUser(user.uid); // Delete the user from firestore
      user.delete().then(() => {
        this.router.navigate(['']).then(() => {
          window.location.reload();
          this.utils.loading = false;
        }).catch((error) => {
          this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
          this.utils.loading = false;
        });
      }).catch((error) => {
        this.displayAuthErrorDialog('report', 'Attention', 'An error has occurred.', error.message, error.code);
        this.utils.loading = false;
      });
    });
  }

  /**
   * Checks if the user contains the profile picture from the Google account
   * @returns true/false
   */
  checkGoogleAccountPhotoURL() {
    if (this.userData.photoURL != null) {
      return this.userData.photoURL.includes('https://lh3.googleusercontent.com');
    }
  }

  /**
   * Deletes the user's image from the storage when the profile is deleted
   * Only delete the photo vom firestorage if it exists
   * It can only exist if the user is NOT using the Google account and the URL is NOT null
   */
  deleteProfilePicture() {
    const firestorageService = this.injector.get(FirestorageService); // Inject storage like this to avoid circular dependency

    if (!this.checkGoogleAccountPhotoURL() && this.userData.photoURL != null) {
      firestorageService.deleteImage(this.userData.photoURL);
    }
  }

  /**
   * Opens the authentication error dialog and shows the user the corresponding errors
   */
  openAuthErrorDialog() {
    this.dialog.open(DialogAuthErrorsComponent);
  }

  /**
   * Opens the already logged in dialog
   */
  openAlreadyLoggedInDialog() {
    this.dialog.open(DialogAlreadyLoggedInComponent);
  }

  /**
   * Opens the error dialog with passed icon and messages
   * @param errorIcon info || warning
   * @param authErrorHeadline Info || Attention
   * @param errorUserMessage A message readable by the user
   * @param errorMessage The message from the error
   * @param errorCode The error code
   */
  displayAuthErrorDialog(errorIcon: string, authErrorHeadline: string, errorUserMessage: string, errorMessage: string, errorCode: string) {
    this.authErrorIcon = errorIcon;
    this.authErrorHeadline = authErrorHeadline;
    this.authErrorUserMessage = errorUserMessage;
    this.authErrorMessage = errorMessage;
    this.authErrorCode = errorCode;
    this.openAuthErrorDialog();
  }
}