#!/usr/bin/env python3
"""
Free product-image URL finder for the supplied product catalog workbook.

What it does:
- Searches DuckDuckGo Images for each product title (no OpenAI API key/credits).
- Checks candidate URLs to see whether they return an actual image.
- Writes the first usable direct image URL into column J.
- Preserves the workbook's existing IMAGE formula in column A.

Notes:
- Search engines may rate-limit or block automated requests.
- Product matches are not guaranteed; review images before using commercially.
- Excel's IMAGE() formula generally requires a supported, current Excel version
  and a publicly accessible image URL.
"""
import argparse
import getpass
import os
import sys
import time
from io import BytesIO

import requests
from ddgs import DDGS
from openpyxl import load_workbook
from PIL import Image

DEFAULT_FILE = "PRODUCT_CATALOG_all_10313_image_search_links.xlsx"
SHEET_NAME = "Product Catalog"
TITLE_COL = 2       # B
DIRECT_URL_COL = 10 # J
IMAGE_FORMULA_COL = 1 # A
API_BASE_URL = os.environ.get(
    "AROUN_API_BASE_URL", "https://aroun-shopping-website-5nnj.onrender.com"
).rstrip("/")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/130.0.0.0 Safari/537.36"
    )
}

def is_valid_image_url(url, timeout=12):
    """Return True if URL responds with image bytes that Pillow can open."""
    if not url or not url.lower().startswith(("http://", "https://")):
        return False
    try:
        response = requests.get(
            url, headers=HEADERS, timeout=timeout, allow_redirects=True
        )
        if response.status_code != 200 or len(response.content) > 12 * 1024 * 1024:
            return False
        content_type = response.headers.get("Content-Type", "").lower()
        if "image/" not in content_type:
            # Some hosts mislabel image files, so verify the bytes as well.
            pass
        if not response.content:
            return False
        try:
            im = Image.open(BytesIO(response.content))
            im.verify()
            return im.format in {"JPEG", "PNG", "GIF", "WEBP", "BMP", "TIFF"}
        except Exception:
            return False
    except requests.RequestException:
        return False

def find_image_url(title, max_results=12):
    # Product title is the search query; results contain direct image URLs.
    try:
        with DDGS() as ddgs:
            results = ddgs.images(
                title,
                region="wt-wt",
                safesearch="moderate",
                max_results=max_results,
            )
            for result in results:
                image_url = result.get("image")
                if image_url and is_valid_image_url(image_url):
                    return image_url
    except Exception as exc:
        print(f"    Search warning: {exc}")
    return None

def upload_image_to_site(session, api_base_url, product, image_url, timeout=30):
    """Download a found image and replace this product's image through the admin API."""
    response = requests.get(
        image_url, headers=HEADERS, timeout=timeout, allow_redirects=True, stream=True
    )
    response.raise_for_status()
    content = bytearray()
    for chunk in response.iter_content(64 * 1024):
        content.extend(chunk)
        if len(content) > 10 * 1024 * 1024:
            raise ValueError("Image exceeds the website's 10 MB upload limit")
    if not content:
        raise ValueError("Image download was empty")

    image = Image.open(BytesIO(content))
    image.verify()
    image_format = image.format
    extensions = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}
    mime_types = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp", "GIF": "image/gif"}
    if image_format not in extensions:
        raise ValueError(f"Unsupported image format: {image_format}")

    safe_title = "".join(char if char.isalnum() else "-" for char in product["title"]).strip("-")[:60]
    filename = f"{safe_title or 'product'}{extensions[image_format]}"
    uploaded = session.put(
        f"{api_base_url}/api/products/{product['_id']}",
        files={"images": (filename, bytes(content), mime_types[image_format])},
        timeout=timeout,
    )
    uploaded.raise_for_status()

def main():
    parser = argparse.ArgumentParser(description="Find free product image URLs for Excel.")
    parser.add_argument("--file", default=DEFAULT_FILE, help="Workbook filename/path")
    parser.add_argument("--limit", type=int, default=10313, help="Maximum number of rows to process (default: 5)")
    parser.add_argument("--start-row", type=int, default=2, help="First product row (default: 2)")
    parser.add_argument("--delay", type=float, default=1.5, help="Seconds between searches (default: 1.5)")
    parser.add_argument("--upload", action="store_true", help="Upload each newly found image to the matching website product")
    parser.add_argument("--api-base-url", default=API_BASE_URL, help="Website backend URL (or set AROUN_API_BASE_URL)")
    args = parser.parse_args()

    api_base_url = args.api_base_url.rstrip("/")
    site_session = None
    products_by_title = {}
    if args.upload:
        phone = input("Admin phone: ").strip()
        password = getpass.getpass("Admin password: ")
        site_session = requests.Session()
        login = site_session.post(
            f"{api_base_url}/api/auth/login",
            json={"phone": phone, "password": password},
            timeout=20,
        )
        login.raise_for_status()
        login_data = login.json()
        if (login_data.get("user") or {}).get("role") != "admin":
            sys.exit("Login succeeded, but this account does not have admin access.")
        token = login_data.get("token")
        if token:
            site_session.headers.update({"Authorization": f"Bearer {token}"})
        product_response = site_session.get(f"{api_base_url}/api/products", timeout=30)
        product_response.raise_for_status()
        for product in product_response.json():
            products_by_title.setdefault(str(product.get("title", "")).strip().casefold(), []).append(product)

    file_path = os.path.abspath(args.file)
    if not os.path.isfile(file_path):
        print(f"ERROR: Workbook not found: {file_path}")
        print("Put this script in the same folder as the workbook, or pass --file with its full path.")
        sys.exit(1)

    wb = load_workbook(file_path)
    if SHEET_NAME not in wb.sheetnames:
        print(f"ERROR: Expected sheet '{SHEET_NAME}' was not found.")
        sys.exit(1)
    ws = wb[SHEET_NAME]

    last_row = ws.max_row
    end_row = min(last_row, args.start_row + max(args.limit, 0) - 1)
    found = 0
    skipped = 0
    failed = 0

    print(f"Workbook: {file_path}")
    print(f"Processing rows {args.start_row}-{end_row} (limit {args.limit})")

    for row in range(args.start_row, end_row + 1):
        title = str(ws.cell(row, TITLE_COL).value or "").strip()
        existing = str(ws.cell(row, DIRECT_URL_COL).value or "").strip()

        if not title:
            skipped += 1
            continue
        if existing.startswith(("https://", "http://")) and is_valid_image_url(existing):
            if not args.upload:
                print(f"Row {row}: already has a valid image URL; keeping it.")
                skipped += 1
                continue
            print(f"Row {row}: uploading existing image URL for {title!r} ...")
            url = existing
        else:
            print(f"Row {row}: searching for {title!r} ...")
            url = find_image_url(title)
        if url:
            ws.cell(row, DIRECT_URL_COL).value = url
            found += 1
            print(f"    FOUND: {url}")
            if site_session:
                matches = products_by_title.get(title.casefold(), [])
                if len(matches) != 1:
                    print(f"    SITE UPLOAD SKIPPED: expected one exact product match; found {len(matches)}.")
                else:
                    try:
                        upload_image_to_site(site_session, api_base_url, matches[0], url)
                        print("    UPLOADED to website product image storage.")
                    except Exception as exc:
                        print(f"    SITE UPLOAD FAILED: {exc}")
        else:
            failed += 1
            print("    No verified image URL found.")
        time.sleep(max(0, args.delay))

    root, ext = os.path.splitext(file_path)
    out_path = f"{root}_with_image_urls{ext or '.xlsx'}"
    wb.save(out_path)
    print("\nFinished.")
    print(f"Image URLs found: {found}; not found: {failed}; skipped: {skipped}")
    print(f"Saved a NEW workbook; original unchanged:\n{out_path}")
    print("Open the new workbook in Excel and allow time for IMAGE() formulas to load.")

if __name__ == "__main__":
    main()
