import { html, fixture, expect } from '@open-wc/testing';

import { PosenetApp } from '../src/PosenetApp.js';
import '../src/posenet-app.js';

describe('PosenetApp', () => {
  let element: PosenetApp;
  beforeEach(async () => {
    element = await fixture(html` <posenet-app></posenet-app> `);
  });

  it('renders a loading element', () => {
    const loading = element.shadowRoot!.querySelector('#loading')!;
    expect(loading).to.exist;
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
