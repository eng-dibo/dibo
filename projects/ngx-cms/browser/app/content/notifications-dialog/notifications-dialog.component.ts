import { Component, Inject } from '@angular/core';
import { PlatformService } from '@engineers/ngx-utils/platform';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';

@Component({
  selector: 'notifications-dialog',
  templateUrl: './notifications-dialog.component.html',
  styleUrls: ['./notifications-dialog.component.scss'],
})
export class NotificationsDialogComponent {
  constructor(
    private httpService: HttpClient,
    private swPush: SwPush,
    private platform: PlatformService
  ) {}
  subscribeToNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('requesting the permission to allow push notifications');
        this.httpService
          .get<string>('config/server/vapid')
          .subscribe((serverPublicKey) =>
            this.swPush
              .requestSubscription({
                serverPublicKey,
              })
              .then((subscription) =>
                this.httpService.post('gcm/save', subscription)
              )
              .catch((err) =>
                console.error('Could not subscribe to notifications', err)
              )
          );
      } else if (Notification.permission === 'denied') {
        // todo: instruct the user to allow notifications
        console.log('notifications permission denied');
      }
    } else {
      console.warn("this browser doesn't support Notifications api");
    }
  }
}
