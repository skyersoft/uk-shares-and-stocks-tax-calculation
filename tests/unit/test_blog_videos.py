"""maintain_blog_index.py: watch-page records and video sitemap entries."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "maintain_blog_index", Path(__file__).parents[2] / "scripts" / "maintain_blog_index.py")
mbi = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mbi)


def _write_post(tmp_path, name, body):
    path = tmp_path / name
    path.write_text('---\ntitle: "T"\ndate: "2026-02-22"\nexcerpt: "E"\n---\n' + body, encoding="utf-8")
    return path


def test_video_id_read_from_youtube_tag(tmp_path, monkeypatch):
    monkeypatch.setattr(mbi, "BLOG_POSTS_DIR", tmp_path)
    post = mbi.parse_frontmatter(_write_post(tmp_path, "a.md", "text\n\n{{youtube:abc_DEF-123}}\n"))
    assert post["videoId"] == "abc_DEF-123"


def test_post_without_video_has_no_watch_page(tmp_path, monkeypatch):
    monkeypatch.setattr(mbi, "BLOG_POSTS_DIR", tmp_path)
    post = mbi.parse_frontmatter(_write_post(tmp_path, "b.md", "no video"))
    assert "videoId" not in post
    assert mbi.build_videos([post]) == []


def test_build_videos_record(tmp_path, monkeypatch):
    monkeypatch.setattr(mbi, "BLOG_POSTS_DIR", tmp_path)
    post = mbi.parse_frontmatter(_write_post(tmp_path, "c.md", "{{youtube:XYZ}}"))
    [video] = mbi.build_videos([post])
    assert video == {
        "slug": "c", "videoId": "XYZ", "title": "T", "description": "E",
        "uploadDate": "2026-02-22", "thumbnailUrl": "https://i.ytimg.com/vi/XYZ/hqdefault.jpg",
    }
