import requests
from bs4 import BeautifulSoup
import cloudscraper
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
from urllib.parse import urlencode
import time


EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
PHONE_REGEX = r'(\+?\d{1,2}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,}'

HUNTER_API_KEY = "8d4489f0ebae7d42effd260b63f82736bc095b84"
GENERIC_PREFIXES = ["info", "contact", "admin", "support", "hello", "team", "sales", "office"]
DECISION_MAKER_KEYWORDS = ["founder", "co-founder", "ceo", "director", "managing partner", "president", "principal"]

def find_emails_in_text(text):
    return re.findall(EMAIL_REGEX, text)

def find_phones_in_text(text):
    phones = re.findall(PHONE_REGEX, text)
    cleaned = set()
    for p in phones:
        phone_str = "".join(p).strip()
        phone_str = re.sub(r'[^\d\+\-\.\s]', '', phone_str)
        if len(phone_str) >= 7:
            cleaned.add(phone_str)
    return cleaned

def find_linkedin_urls(soup, base_url):
    linkedin_urls = set()
    for a in soup.find_all("a", href=True):
        href = a['href']
        if "linkedin.com" in href:
            full_url = urljoin(base_url, href)
            linkedin_urls.add(full_url)
    return linkedin_urls

def get_contact_page_urls(base_url):
    paths = ["/contact", "/contact-us", "/contactus", "/about", "/about-us", "/aboutus", "/team", "/services"]
    return [urljoin(base_url, path) for path in paths]

def validate_email_with_hunter(email):
    url = "https://api.hunter.io/v2/email-verifier"
    params = {"email": email, "api_key": HUNTER_API_KEY}
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        if response.status_code == 200 and "data" in data:
            verification = data["data"]
            local_part = email.split('@')[0].lower()
            is_generic = any(local_part.startswith(prefix) for prefix in GENERIC_PREFIXES)
            return {
                "email": email,
                "result": verification.get("result"),
                "score": verification.get("score", 0),
                "is_generic": is_generic
            }
    except:
        pass
    return {"email": email, "result": None, "score": 0, "is_generic": True}

def analyze_website_features(base_url, scraper):
    subpages = ["/contact", "/contact-us", "/about", "/about-us", "/team", "/services"]
    found_pages, contact_form_found, decision_maker_mentioned, last_modified = [], False, False, None
    headers = {"User-Agent": "Mozilla/5.0"}

    for path in subpages:
        full_url = urljoin(base_url, path)
        try:
            res = scraper.get(full_url, timeout=10, headers=headers)
            if res.status_code == 200:
                found_pages.append(path)
                soup = BeautifulSoup(res.text, "html.parser")
                if soup.find("form") and ("contact" in path or "team" in path):
                    contact_form_found = True
                if any(k in soup.get_text().lower() for k in DECISION_MAKER_KEYWORDS):
                    decision_maker_mentioned = True
                if not last_modified:
                    meta = soup.find("meta", {"http-equiv": "last-modified"})
                    if meta and meta.get("content"):
                        last_modified = meta["content"]
        except:
            continue

    if not last_modified:
        try:
            head = scraper.head(base_url, timeout=5, allow_redirects=True)
            last_modified = head.headers.get("Last-Modified")
        except:
            pass

    recent = False
    if last_modified:
        try:
            dt = datetime.strptime(last_modified, "%a, %d %b %Y %H:%M:%S %Z")
            recent = (datetime.utcnow() - dt).days < 180
        except:
            pass

    return {
        "subpages_found": found_pages,
        "contact_form_found": contact_form_found,
        "site_last_modified": last_modified,
        "recently_updated": recent,
        "decision_maker_mentioned": decision_maker_mentioned
    }

def compute_score(result):
    score = 0
    breakdown = []

    if result.get("website"):
        score += 10
        breakdown.append("Website found: +10")

    if result.get("linkedin"):
        score += 10
        breakdown.append("LinkedIn link(s) found: +10")

    if result.get("phones"):
        score += 5
        breakdown.append("Phone number found: +5")

    features = result.get("features", {})
    subpages_count = len(features.get("subpages_found", []))
    score += min(subpages_count, 5)
    breakdown.append(f"{subpages_count} useful subpages found: +{min(subpages_count, 5)}")

    if features.get("contact_form_found"):
        score += 5
        breakdown.append("Contact form found: +5")

    if features.get("recently_updated"):
        score += 5
        breakdown.append("Site recently updated: +5")

    if features.get("decision_maker_mentioned"):
        score += 10
        breakdown.append("Decision-maker keywords found: +10")

    # If no validated emails, return current score and breakdown
    validated = result.get("validated_emails", [])
    if not validated:
        breakdown.append("No email(s) validated.")
        return score, breakdown

    # Select email with highest Hunter score
    best_email = max(validated, key=lambda e: e.get("score", 0))
    email_score = 0
    email_breakdown = []

    if best_email["result"] == "deliverable":
        email_score += 15
        email_breakdown.append(f"{best_email['email']} is deliverable: +15")

    if best_email["is_generic"]:
        email_score += 5
        email_breakdown.append(f"{best_email['email']} is generic: +5")
    else:
        email_score += 15
        email_breakdown.append(f"{best_email['email']} is personal: +15")

    hunter_contribution = int(best_email["score"] / 10)
    email_score += hunter_contribution
    email_breakdown.append(f"{best_email['email']} Hunter score: +{hunter_contribution}")

    score += email_score
    breakdown.extend(email_breakdown)

    # Append section that lists all validated emails and their scores
    if len(validated) > 1:
        breakdown.append("Multiple emails found:")
        for e in validated:
            breakdown.append(f"  - {e['email']} (score: {e.get('score', 0)}, generic: {e['is_generic']})")

    return score, breakdown


def scrape_yellowpages(company, location, max_results=10):
    scraper = cloudscraper.create_scraper()
    base_url = "https://www.yellowpages.com/search"
    params = {"search_terms": company, "geo_location_terms": location}

    query_string = urlencode(params)
    full_url = base_url + "?" + query_string

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }

    for attempt in range(3):  # Retry 3 times
        try:
            response = scraper.get(full_url, headers=headers, timeout=10)
            if response.status_code == 200:
                break
            else:
                print(f"Attempt {attempt+1} failed with status {response.status_code}")
        except Exception as e:
            print(f"Attempt {attempt+1} exception: {e}")
        time.sleep(2)
    else:
        print("YellowPages fetch error: Failed after 3 attempts.")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    listings = soup.find_all("div", class_="result", limit=max_results)
    results = []


    for listing in listings:
        name_tag = listing.find("a", class_="business-name")
        if not name_tag:
            continue

        name = name_tag.get_text(strip=True)
        website_tag = listing.find("a", class_="track-visit-website")
        website_url = website_tag["href"] if website_tag else None
        if website_url and not urlparse(website_url).scheme:
            website_url = "http://" + website_url

        phone_tag = listing.find("div", class_="phones phone primary")
        phone_num = phone_tag.get_text(strip=True) if phone_tag else None

        emails, linkedins, phones = set(), set(), set()
        if phone_num: phones.add(phone_num)

        if website_url:
            for contact_url in get_contact_page_urls(website_url):
                try:
                    res = scraper.get(contact_url, timeout=10)
                    if res.status_code == 200:
                        emails.update(find_emails_in_text(res.text))
                        linkedins.update(find_linkedin_urls(BeautifulSoup(res.text, "html.parser"), contact_url))
                except: continue

            features = analyze_website_features(website_url, scraper)
        else:
            features = {}

        validated = [validate_email_with_hunter(email) for email in emails]

        result = {
            "name": name,
            "website": website_url,
            "emails": list(emails),
            "phones": list(phones),
            "linkedin": list(linkedins),
            "features": features,
            "validated_emails": validated
        }

        result["score"], result["score_breakdown"] = compute_score(result)
        results.append(result)

    return results


# ------------ MAIN RUN -------------------

if __name__ == "__main__":
    company = input("Enter business type: ")
    location = input("Enter location: ")
    results = scrape_yellowpages(company, location, max_results=10)

    if not results:
        print("No leads found.")
    else:
        for i, r in enumerate(results, 1):
            print(f"\n{i}. {r['name']}")
            print(f"   🌐 Website: {r['website'] or 'N/A'}")
            print(f"   📬 Emails: {', '.join(r['emails']) if r['emails'] else 'None'}")
            print(f"   ☎️ Phones: {', '.join(r['phones']) if r['phones'] else 'None'}")
            print(f"   🔗 LinkedIn: {', '.join(r['linkedin']) if r['linkedin'] else 'None'}")
            print(f"   🧠 Score: {r['score']}/100")
            print("   💡 Breakdown:")
            for line in r["score_breakdown"]:
                print(f"      - {line}")
