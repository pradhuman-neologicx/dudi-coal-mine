import {
  Injectable,
  ComponentRef,
  Injector,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationComponent } from 'src/app/website/notification/notification.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private activeNotifications: ComponentRef<NotificationComponent>[] = [];
  private notificationHosts: HTMLElement[] = [];

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}

  show(
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    duration: number = 3000
  ): void {
    // Prevent duplicate exact same messages
    const isDuplicate = this.activeNotifications.some(ref => ref.instance.message === message);
    if (isDuplicate) return;

    let wrapper = document.getElementById('global-toast-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'global-toast-wrapper';
      wrapper.style.position = 'fixed';
      wrapper.style.top = '20px';
      wrapper.style.right = '20px';
      wrapper.style.zIndex = '9999';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = '10px';
      wrapper.style.pointerEvents = 'none';
      document.body.appendChild(wrapper);
    }

    // Create a DOM element to host our component
    const notificationHost = document.createElement('div');
    notificationHost.style.pointerEvents = 'auto';
    wrapper.appendChild(notificationHost);
    this.notificationHosts.push(notificationHost);

    // Create the notification component
    const notificationComponentRef = createComponent(NotificationComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: notificationHost,
    });

    // Set the input properties
    const instance = notificationComponentRef.instance;
    instance.message = message;
    instance.type = type;
    instance.duration = duration;

    // Listen for the closed event
    instance.closed.subscribe(() => {
      this.removeNotification(notificationComponentRef, notificationHost);
    });

    // Attach to the application change detection mechanism
    this.appRef.attachView(notificationComponentRef.hostView);

    // Add to active notifications
    this.activeNotifications.push(notificationComponentRef);

    // Set a backup timeout in case the closed event doesn't fire
    setTimeout(() => {
      this.removeNotification(notificationComponentRef, notificationHost);
    }, duration + 500);
  }

  private removeNotification(
    componentRef: ComponentRef<NotificationComponent>,
    hostElement: HTMLElement
  ): void {
    const index = this.activeNotifications.indexOf(componentRef);
    if (index > -1) {
      this.activeNotifications.splice(index, 1);

      // Safely remove from DOM only if it's still in the document
      try {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();

        const hostIndex = this.notificationHosts.indexOf(hostElement);
        if (hostIndex > -1) {
          this.notificationHosts.splice(hostIndex, 1);
        }

        const wrapper = document.getElementById('global-toast-wrapper');
        if (wrapper && wrapper.contains(hostElement)) {
          wrapper.removeChild(hostElement);
        }
      } catch (error) {
        console.warn('Error cleaning up notification:', error);
      }
    }
  }
}
