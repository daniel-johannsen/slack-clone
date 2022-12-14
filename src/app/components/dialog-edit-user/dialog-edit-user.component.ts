import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogDeleteUserComponent } from '../dialog-delete-user/dialog-delete-user.component';
import { AuthService } from 'src/app/services/auth.service';
import { FirestorageService } from 'src/app/services/firestorage.service';

@Component({
  selector: 'app-dialog-edit-user',
  templateUrl: './dialog-edit-user.component.html',
  styleUrls: ['./dialog-edit-user.component.scss']
})
export class DialogEditUserComponent {

  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<DialogEditUserComponent>,
    public firestorage: FirestorageService) {
    this.authService.newDisplayName = this.authService.userData.displayName;
  }

  /**
   * Opens a dialog to confirm the deletion of the user
   */
  openDeleteUserDialog() {
    this.dialog.open(DialogDeleteUserComponent);
  }

}
