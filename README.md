# Apex Inventory & Order Management System

Apex Inventory & Order Management System (APEXSYS) is a production-ready, full-stack microservice application designed to streamline product catalog tracking, customer profile registry, and transactional checkout lifecycles.

It features a sleek dark-themed React single-page application (SPA), an asynchronous FastAPI REST backend, and PostgreSQL relational storage with automatic SQLite fallback capabilities.

---

## 🚀 Key Features

* **Landing Page with API Sandbox:** An interactive terminal emulator homepage where developers can click tabs to preview live request and response JSON schemas.
* **ACID Transactional Checkouts:** Employs row-locking queries (`with_for_update`) during order checkouts to ensure inventory levels are validated and updated atomically, rolling back on insufficient stock to avoid race conditions.
* **Uniqueness Constraints:** Natively enforces case-sensitive SKU uniqueness checks and email validations at both payload schema and database levels.
* **Zero-Configuration Fallback:** Automatically switches to a local SQLite database (`sqlite:///./inventory.db`) with foreign key constraints enabled on startup if the PostgreSQL service is unreachable.
* **Low Stock Alerts & Inline Replenishment:** Real-time dashboard summaries monitor stock counts below threshold levels (&lt; 10 units) and offer one-click stock refills.

---

## 🛠️ Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React (JavaScript / HTML / CSS) | Responsive SPA UI with glassmorphic style panels and custom toast alerts. |
| **Backend** | Python (FastAPI) | High-performance, async REST API with Pydantic validation and auto-generated Swagger UI. |
| **Database** | PostgreSQL / SQLite | ACID relational database with dynamic local database fallbacks. |
| **Orchestration** | Docker & Docker Compose | Containerizes the frontend, backend API, and database services. |

---

## 📂 Project Structure

```
inventory-order-system/
├── backend/
│   ├── app/
│   │   ├── config.py        # Settings loader with Pydantic BaseSettings
│   │   ├── database.py      # SQLAlchemy engine configuration with SQLite fallback
│   │   ├── models.py        # Relational models (Product, Customer, Order, OrderItem)
│   │   ├── schemas.py       # Input/Output validation payloads
│   │   ├── crud.py          # ACID database transaction logic
│   │   └── main.py          # FastAPI application entry & seeder endpoint
│   ├── Dockerfile           # Multi-stage python container setup
│   └── requirements.txt     # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Dashboard, ProductList, CustomerList, OrderList, Toast, LandingPage)
│   │   ├── App.jsx          # Route manager SPA
│   │   ├── App.css          # Customized glassmorphic CSS styling sheet
│   │   └── main.jsx         # React mounting
│   ├── index.html           # Document template loading "Outfit" Google Font
│   ├── vite.config.js       # Vite server configuration (Port 3000 + Docker hosts)
│   └── Dockerfile           # Frontend node developer environment
├── docker-compose.yml       # Service composition (db, backend, frontend)
├── .gitignore               # Root git exclusions (.env, virtualenvs, local databases)
└── README.md                # General system documentation
```

---

## ⚙️ How to Run the System

### Method A: Running with Docker Compose (Recommended)
Build and run the entire containerized stack:
```bash
docker-compose up --build -d
```
* **Frontend Web App:** `http://localhost:3000`
* **Backend API Docs (Swagger UI):** `http://localhost:8000/docs`

### Method B: Running Locally (Host Fallback)
If Docker Desktop is offline, you can run the services directly on your host machine.

#### 1. Launch the Backend API
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **Windows:** `.venv\Scripts\activate`
   * **macOS/Linux:** `source .venv/bin/activate`
3. Start the Uvicorn web server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
   *Note: On startup, the terminal will report a database warning and automatically mount a local `inventory.db` SQLite file.*

#### 2. Launch the Frontend Client
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📝 API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/seed` | `POST` | Seeds the database with sample products, customers, and order history. |
| `/dashboard/stats` | `GET` | Fetches aggregated counts and active low stock alerts. |
| `/products` | `POST` | Creates a new product catalog listing. Requires unique SKU. |
| `/products` | `GET` | Retrieves all product items. |
| `/products/{id}` | `PUT` | Updates details of a product (including stock levels). |
| `/products/{id}` | `DELETE` | Deletes product if it has no active orders. |
| `/customers` | `POST` | Registers a customer profile. Requires unique email. |
| `/customers` | `GET` | Retrieves all registered customers. |
| `/orders` | `POST` | Processes a transactional checkout with atomic stock deductions. |
| `/orders` | `GET` | Retrieves invoices listing snapshotted pricing and item subtotals. |
| `/orders/{id}` | `DELETE` | Cancels an order and automatically restores quantities back to warehouse inventory. |

---

## 🛡️ License

Built as a technical assessment demonstrator under the Software Engineer specification. Secured against environment variable leaks and credentials exposure.
