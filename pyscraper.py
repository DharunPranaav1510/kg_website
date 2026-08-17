import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re

BASE_URL = "https://www.kgfoods.co.in/"

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

visited = set()
pages_to_visit = [BASE_URL]

found_prices = []  # list of { page, product, price }

# Common price patterns
PRICE_PATTERN = re.compile(r'₹\s*[\d,]+(?:\.\d{1,2})?|Rs\.?\s*[\d,]+(?:\.\d{1,2})?|\bINR\s*[\d,]+', re.IGNORECASE)

def extract_prices_from_page(url, soup):
    results = []

    # --- Strategy 1: Structured product containers ---
    # Try common e-commerce product card selectors
    product_selectors = [
        ".product", ".product-item", ".product-card",
        ".woocommerce-product", "[class*='product']",
        ".item", ".shop-item", ".card",
    ]
    price_selectors = [
        ".price", ".product-price", ".woocommerce-Price-amount",
        "[class*='price']", ".amount", ".cost", "bdi",
    ]
    name_selectors = [
        "h1", "h2", "h3", "h4",
        ".product-title", ".product-name", "[class*='title']", "[class*='name']",
    ]

    for p_sel in product_selectors:
        containers = soup.select(p_sel)
        for container in containers:
            price_el = None
            for pr_sel in price_selectors:
                price_el = container.select_one(pr_sel)
                if price_el:
                    break

            if not price_el:
                continue

            price_text = price_el.get_text(strip=True)
            if not PRICE_PATTERN.search(price_text):
                continue

            name_el = None
            for n_sel in name_selectors:
                name_el = container.select_one(n_sel)
                if name_el:
                    break

            name = name_el.get_text(strip=True) if name_el else "(unnamed)"
            results.append({ "page": url, "product": name, "price": price_text })

    # --- Strategy 2: Full-page text scan (catches anything missed above) ---
    # Walk all text nodes and flag those matching price pattern
    if not results:
        all_text_nodes = soup.find_all(string=PRICE_PATTERN)
        for node in all_text_nodes:
            parent = node.parent
            price_text = node.strip()

            # Walk up to find nearest heading / sibling label
            name = "(unknown)"
            for ancestor in parent.parents:
                heading = ancestor.find(["h1", "h2", "h3", "h4", "h5"])
                if heading:
                    name = heading.get_text(strip=True)
                    break

            results.append({ "page": url, "product": name, "price": price_text })

    return results


while pages_to_visit:
    page_url = pages_to_visit.pop()

    if page_url in visited:
        continue
    visited.add(page_url)

    try:
        print(f"Scanning: {page_url}")
        response = requests.get(page_url, headers=headers, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        page_prices = extract_prices_from_page(page_url, soup)
        found_prices.extend(page_prices)

        # Follow internal links
        for a in soup.find_all("a", href=True):
            href = urljoin(page_url, a["href"])
            if (
                urlparse(href).netloc == urlparse(BASE_URL).netloc
                and href not in visited
                and "#" not in href          # skip anchors
                and "javascript" not in href # skip js links
            ):
                pages_to_visit.append(href)

    except Exception as e:
        print(f"  Error on {page_url}: {e}")


# --- Print results ---
print("\n" + "=" * 60)
print(f"  PRICES FOUND ON kgfoods.co.in  ({len(found_prices)} entries)")
print("=" * 60)

if found_prices:
    current_page = None
    for entry in found_prices:
        if entry["page"] != current_page:
            current_page = entry["page"]
            print(f"\n📄 {current_page}")
            print("-" * 55)
        print(f"  🛒 {entry['product']}")
        print(f"     💰 {entry['price']}")
else:
    print("\n  No prices found.")
    print("  The site may use JavaScript rendering (React/Next.js SPA).")
    print("  Consider using Playwright or Selenium for JS-rendered pages.")

print("\n" + "=" * 60)
print("Done.")