import html
import json
import re
import time
from html.parser import HTMLParser
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

CLOUDBASE_URL = "https://cloudbase.gg/geforce-now-games/"
STEAM_SEARCH_URL = "https://store.steampowered.com/api/storesearch/?cc=us&l=en&term={}"


def fetch(url):
    request = Request(url, headers={"User-Agent": "SteamGeForceCatalog/1.0"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


class CloudbaseParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.games = set()
        self.href = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        href = dict(attrs).get("href", "")
        if tag == "a" and "/g/" in href:
            self.href = urljoin(CLOUDBASE_URL, href)
            self.text = []

    def handle_data(self, data):
        if self.href is not None:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.href is not None:
            title = html.unescape(" ".join("".join(self.text).split())).strip()
            if title:
                self.games.add(title)
            self.href = None
            self.text = []


def normalize(title):
    title = title.lower().replace("&", " and ")
    title = re.sub(r"\b(tm|r|edition|deluxe|ultimate|goty)\b", " ", title)
    return re.sub(r"[^a-z0-9]+", " ", title).strip()


def find_steam_app(title):
    try:
        data = json.loads(fetch(STEAM_SEARCH_URL.format(quote(title))))
    except Exception as error:
        print(f"Steam search failed for {title!r}: {error}")
        return None

    target = normalize(title)
    candidates = data.get("items", [])
    for candidate in candidates:
        if normalize(candidate.get("name", "")) == target:
            return str(candidate["id"]), candidate["name"]
    return None


def main():
    parser = CloudbaseParser()
    parser.feed(fetch(CLOUDBASE_URL))
    catalog = {}
    games = sorted(parser.games, key=str.casefold)
    print(f"Found {len(games)} Cloudbase games")

    for index, title in enumerate(games, start=1):
        match = find_steam_app(title)
        if match:
            app_id, steam_title = match
            catalog[app_id] = {"available": True, "title": steam_title}
        if index % 25 == 0:
            print(f"Processed {index}/{len(games)}")
        time.sleep(0.15)

    with open("catalog.json", "w", encoding="utf-8") as output:
        json.dump(catalog, output, ensure_ascii=False, indent=2, sort_keys=True)
        output.write("\n")
    print(f"Wrote {len(catalog)} Steam App IDs")


if __name__ == "__main__":
    main()
