import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-install-dialog',
  templateUrl: './app-install-dialog.component.html',
  styleUrls: ['./app-install-dialog.component.scss'],
})
export class AppInstallDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) private dialogData: any) {}
  installApp() {
    let appInstallEvent = this.dialogData;
    appInstallEvent.prompt();
    appInstallEvent.userChoice.then((userChoice: any) => {
      console.log({ userChoice });
      // todo: if(userChoice.outCome==='dismissed')..
      // else the app installed in userChoice.platform
    });
  }
}
