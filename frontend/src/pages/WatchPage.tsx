import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import NotFoundPage from './NotFoundPage';
import videos from '../content/videos.json';

export interface WatchVideo {
  slug: string;
  videoId: string;
  title: string;
  description: string;
  uploadDate: string;
  thumbnailUrl: string;
}

const SITE_URL = 'https://cgttaxtool.uk';

export const findVideo = (slug?: string): WatchVideo | undefined =>
  (videos as WatchVideo[]).find(v => v.slug === slug);

export const videoStructuredData = (video: WatchVideo) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: video.title,
  description: video.description || video.title,
  thumbnailUrl: [video.thumbnailUrl],
  uploadDate: video.uploadDate,
  embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
  url: `${SITE_URL}/watch/${video.slug}`,
});

// A watch page: the single video is the main content and comes first, in the
// pre-rendered HTML, at full size. Everything else is short and below it.
const WatchPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const video = findVideo(slug);
  if (!video) return <NotFoundPage />;

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <SEOHead
        title={video.title}
        description={video.description || video.title}
        ogType="video.other"
        ogImage={video.thumbnailUrl}
        twitterCard="summary_large_image"
        structuredData={videoStructuredData(video)}
      />
      <h1 className="h3 mb-3">{video.title}</h1>
      <div className="ratio ratio-16x9 mb-3 bg-light rounded overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      {video.description && <p className="lead">{video.description}</p>}
      <p>
        <Link to={`/blog/post/${video.slug}`}>Read the full article</Link>
        {' · '}
        <Link to="/calculator">Calculate your UK capital gains tax</Link>
      </p>
    </main>
  );
};

export default WatchPage;
