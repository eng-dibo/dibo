import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlatformService } from '@engineers/ngx-utils/platform';

@Component({
  selector: 'app-dialog',
  templateUrl: './app-dialog.component.html',
  styleUrls: ['./app-dialog.component.scss'],
})
export class AppDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogData: any,
    private platform: PlatformService
  ) {}
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
