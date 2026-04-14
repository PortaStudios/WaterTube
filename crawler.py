import json
import requests
import os
import time
import random
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# --- CONFIGURATION ---
FILE_NAME = "full_index.json"
WORK_DURATION = 60  # 1 minute of work
REST_DURATION = 10  # 10 seconds of sleep
SITE_DELAY = 2  # Tiny pause between site visits

LANGUAGE_TLDS = {
    # Greek
    ".el": "Greek",
    ".gr": "Greek",
    ".cy": "Greek",
    # Spanish
    ".es": "Spanish",
    ".mx": "Spanish",
    ".ar": "Spanish",
    ".co.es": "Spanish",
    # French
    ".fr": "French",
    ".be": "French",
    ".ca": "French",
    # German
    ".de": "German",
    ".at": "German",
    ".ch": "German",
    # Italian
    ".it": "Italian",
    # Portuguese
    ".pt": "Portuguese",
    ".br": "Portuguese",
    # Russian
    ".ru": "Russian",
    ".su": "Russian",
    # Japanese
    ".jp": "Japanese",
    ".co.jp": "Japanese",
    ".or.jp": "Japanese",
    # Chinese
    ".cn": "Chinese",
    ".com.cn": "Chinese",
    ".com.hk": "Chinese",
    ".hk": "Chinese",
    ".tw": "Chinese",
    # Other languages
    ".nl": "Dutch",
    ".pl": "Polish",
    ".se": "Swedish",
    ".no": "Norwegian",
    ".dk": "Danish",
    ".fi": "Finnish",
    ".tr": "Turkish",
    ".hu": "Hungarian",
    ".ro": "Romanian",
    ".cz": "Czech",
    ".sk": "Slovak",
    ".bg": "Bulgarian",
    ".hr": "Croatian",
    ".rs": "Serbian",
    ".si": "Slovenian",
    ".lt": "Lithuanian",
    ".lv": "Latvian",
    ".ee": "Estonian",
    ".ua": "Ukrainian",
    ".by": "Belarusian",
    ".kz": "Kazakh",
    # English (generic TLDs - should be checked LAST)
    ".com": "English",
    ".org": "English",
    ".net": "English",
    ".io": "English",
    ".co": "English",
    ".uk": "English",
    ".au": "English",
    ".nz": "English",
    ".za": "English",
    ".in": "English",
    ".ph": "English",
    ".sg": "English",
    ".my": "English",
    ".pk": "English",
    ".ng": "English",
    ".ke": "English",
    ".gh": "English",
    ".ie": "English",
    ".gov": "English",
    ".edu": "English",
}


def detect_language(url):
    """Detect language from URL by checking the actual domain TLD."""
    url_lower = url.lower()

    # Extract domain from URL (remove protocol and path)
    # URL format: https://sub.domain.tld/path
    try:
        # Get just the host part
        if "://" in url_lower:
            host = url_lower.split("://")[1].split("/")[0]
        else:
            host = url_lower.split("/")[0]

        # Find the last dot position (start of TLD)
        last_dot = host.rfind(".")
        if last_dot == -1:
            return "Other"

        # Get the TLD (e.g., ".es", ".com.es")
        tld = host[last_dot:]

        # Check for two-part TLDs first (e.g., .co.uk, .com.es)
        if last_dot > 0:
            second_last_dot = host.rfind(".", 0, last_dot)
            if second_last_dot > 0:
                two_part_tld = host[second_last_dot:]
                if two_part_tld in LANGUAGE_TLDS:
                    return LANGUAGE_TLDS[two_part_tld]

        # Check single TLD
        if tld in LANGUAGE_TLDS:
            return LANGUAGE_TLDS[tld]

        return "Other"

    except:
        return "Other"


SEEDS = [
    "https://www.wikipedia.org",
    "https://www.reddit.com",
    "https://www.github.com",
    "https://www.bbc.com",
    "https://www.amazon.com",
    "https://www.nytimes.com",
    "https://www.nasa.gov",
    "https://www.imdb.com",
]


def load_data():
    if os.path.exists(FILE_NAME):
        try:
            with open(FILE_NAME, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []


def save_data(data):
    with open(FILE_NAME, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


def crawl():
    print("🚀 WaterTube Pure Crawler Started (1min Work / 10s Sleep)")

    data = load_data()
    indexed_urls = {item["url"].lower().rstrip("/") for item in data}

    while True:
        start_time = time.time()
        print(f"⏱️ Cycle Started. Memory: {len(data)} links.")

        while time.time() - start_time < WORK_DURATION:
            # Pick a target: 20% Seed, 80% found link (Recursive)
            if not data or random.random() < 0.2:
                root_url = random.choice(SEEDS)
            else:
                root_url = random.choice(data)["url"]

            try:
                headers = {"User-Agent": "WaterTubeBot/1.4"}
                res = requests.get(root_url, timeout=5, headers=headers)
                soup = BeautifulSoup(res.text, "html.parser")

                new_found = 0
                for link in soup.find_all("a", href=True):
                    url = urljoin(root_url, link["href"]).split("#")[0].split("?")[0]
                    clean_url = url.lower().rstrip("/")
                    title = link.get_text().strip()

                    if (
                        url.startswith("http")
                        and clean_url not in indexed_urls
                        and len(title) > 2
                    ):
                        entry = {
                            "title": title,
                            "url": url,
                            "language": detect_language(url),
                        }
                        data.append(entry)
                        indexed_urls.add(clean_url)
                        new_found += 1

                save_data(data)
                if new_found > 0:
                    print(f"   ✨ Added {new_found} links from {root_url}")

                time.sleep(SITE_DELAY)

            except:
                continue

        print(f"💤 Minute up. Sleeping {REST_DURATION}s...")
        time.sleep(REST_DURATION)


if __name__ == "__main__":
    crawl()
