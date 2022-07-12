import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';

@Component({
  selector: 'notifications-dialog',
  templateUrl: './notifications-dialog.component.html',
  styleUrls: ['./notifications-dialog.component.scss'],
})
export class NotificationsDialogComponent {
  constructor(private httpService: HttpClient, private swPush: SwPush) {}

  subscribeToNotifications() {
    this.httpService
      .get<string>('config/server/vapid')
      .subscribe((serverPublicKey) =>
        this.swPush
          .requestSubscription({
            serverPublicKey,
          })
          .then((subscription) =>
            this.httpService
              .post<any>('push_notifications/save', {
                subscription,
                device: localStorage.getItem('device'),
              })
              .subscribe(
                (push: any) => {
                  localStorage.setItem(
                    'PushSubscriptionKey',
                    // subscription.getKey('p256dh') returns ArrayBuffer
                    subscription.toJSON().keys!.p256dh
                  );
                  console.log({ push });
                },
                (error: any) => console.error({ error })
              )
          )
          .catch((error) =>
            console.error('Could not subscribe to notifications', error)
          )
      );
  }
}
