import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogDeleteMessageComponent } from '../dialog-delete-message/dialog-delete-message.component';
import { DialogEditMessageComponent } from '../dialog-edit-message/dialog-edit-message.component';
import { AuthService } from '../_services/auth.service';
import { FirestoreService } from '../_services/firestore.service';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss'],
})
export class ChatroomComponent implements OnInit {
  channelId: any = '';
  input: any;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    public dialogRef: MatDialog,
    public firestoreService: FirestoreService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      this.firestoreService.channelId = paramMap.get('id');
      console.log('GOT ID:', this.firestoreService.channelId);
    });
    this.firestoreService.updateChat();
  }

  dialogDeleteMessage(message) {
    this.firestoreService.currentMessage = message;
    this.dialog.open(DialogDeleteMessageComponent);
  }

  dialogEditMessage(message) {
    this.firestoreService.indexOfMessage =
      this.firestoreService.messages.indexOf(message);
    console.log('index of message: ', this.firestoreService.indexOfMessage);
    this.firestoreService.currentMessage = message;
    this.firestoreService.deleteAllMessagesOfChat();
    console.log('message to edit: ', this.firestoreService.currentMessage);
    this.dialog.open(DialogEditMessageComponent, { disableClose: true });
  }
}
