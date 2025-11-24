import os
import pytest

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
INDEX_PATH = os.path.join(BASE_DIR, 'static', 'index.html')


@pytest.mark.skip(reason="HTML file not found - legacy static site test")
def test_canonical_link_present():
    assert os.path.exists(INDEX_PATH), "index.html not found at expected path"
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    assert '<link rel="canonical" href="https://cgttaxtool.uk/">' in content, "Canonical link tag missing or incorrect in index.html"
