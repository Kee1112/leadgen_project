# leadgen_project


# 🚀 Smart Lead Generation Tool

This project is a modern, responsive full-stack application that scrapes, validates, and scores business leads. It includes a **Next.js frontend** and a **custom backend API** for scraping and scoring.

---

## 📸 Features

- 🔍 Search businesses by domain and location
- 🕸️ Scrape websites, LinkedIn, and subpages
- 📬 Extract emails, phone numbers, contact forms
- ✅ Validate emails using Hunter API
- 🎯 Score leads using 10 key parameters
- 📊 View detailed score breakdown
- 💾 Persist results using `localStorage` across pages
- 🎨 Responsive UI with glowing gradient visuals

---

## 🧑‍💻 Tech Stack

### Frontend:
- [Next.js 14 (App Router)](https://nextjs.org/docs/app)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- `localStorage` for persistence

### Backend:
- [FastAPI (Python)](https://fastapi.tiangolo.com/) or Node.js (Express)
- `cloudscraper`, `BeautifulSoup` for scraping
- `Hunter.io API` for email validation
- Email + LinkedIn + subpage parsing logic
- Custom lead scoring engine

---

## 🚀 Getting Started

###Clone the Repository

```bash
git clone https://github.com/Kee1112/leadgen_project.git
```
### for backend 
```bash
cd leadgen_project/leadgen-backend
uvicorn app.main:app
```
Backend will run at http://localhost:8000


### for frontend
```bash
cd leadgen_project/leadgen
npm install
npm run dev
```
Frontend will run at http://localhost:3000


api key used:




