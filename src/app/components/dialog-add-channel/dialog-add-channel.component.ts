import { Component } from '@angular/core';
import { Channel } from 'src/app/models/channel.class';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-add-channel',
  templateUrl: './dialog-add-channel.component.html',
  styleUrls: ['./dialog-add-channel.component.scss'],
})
export class DialogAddChannelComponent {
  channel: Channel = new Channel();

  constructor(
    public afs: AngularFirestore,
    public ref: MatDialogRef<DialogAddChannelComponent>
  ) { }

  createChannel() {
    this.channel.channelName = this.channel.channelName.toLowerCase();

    this.afs
      .collection('channels')
      .add(Object.assign({}, this.channel))
      .then(() => {
        this.ref.close();
      });
  }
}
