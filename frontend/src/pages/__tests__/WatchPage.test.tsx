import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WatchPage, { findVideo, videoStructuredData } from '../WatchPage';
import videos from '../../content/videos.json';

jest.mock('../../components/seo/SEOHead', () => ({ __esModule: true, default: () => null }));
jest.mock('../NotFoundPage', () => ({ __esModule: true, default: () => <div>not found</div> }));

const renderAt = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/watch/${slug}`]}>
      <Routes><Route path="/watch/:slug" element={<WatchPage />} /></Routes>
    </MemoryRouter>
  );

describe('WatchPage', () => {
  const video = (videos as any[])[0];

  it('puts the player first, right after the heading, as the main content', () => {
    const { container } = renderAt(video.slug);
    const main = container.querySelector('main')!;
    expect(main.children[0].tagName).toBe('H1');
    expect(main.children[1].querySelector('iframe')!.getAttribute('src'))
      .toBe(`https://www.youtube.com/embed/${video.videoId}`);
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('emits VideoObject JSON-LD with the fields Google requires', () => {
    const ld = videoStructuredData(findVideo(video.slug)!) as any;
    expect(ld['@type']).toBe('VideoObject');
    expect(ld.thumbnailUrl[0]).toContain(video.videoId);
    expect(ld.uploadDate).toBe(video.date ?? video.uploadDate);
    expect(ld.embedUrl).toContain(video.videoId);
  });

  it('shows not-found for an unknown slug', () => {
    const { getByText } = renderAt('nope');
    expect(getByText('not found')).toBeTruthy();
  });
});
