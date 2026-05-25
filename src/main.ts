import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const shouldForceHttps = (): boolean => {
  const { protocol, hostname } = window.location;
  return protocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1';
};

if (shouldForceHttps()) {
  const { href } = window.location;
  window.location.replace(href.replace('http:', 'https:'));
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
