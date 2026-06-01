from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud, database
from .database import engine, get_db

# Create DB tables if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Backend API for managing products, customers, and order lifecycles.",
    version="1.0.0"
)

# CORS configuration
origins = [origin.strip() for origin in settings.cors_origins.split(",")] if settings.cors_origins else ["*"]
is_wildcard = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Inventory & Order Management API is running. Go to /docs for API documentation."}


# --- Products Endpoints ---

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db=db)

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db=db, product_id=product_id, product_update=product_update)

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return crud.delete_product(db=db, product_id=product_id)


# --- Customers Endpoints ---

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db=db)

@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    return crud.delete_customer(db=db, customer_id=customer_id)


# --- Orders Endpoints ---

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order_data=order)

# Helper function to enrich database Order objects with presentation metadata
def enrich_order_response(order: models.Order) -> schemas.OrderResponseDetailed:
    return schemas.OrderResponseDetailed(
        id=order.id,
        customer_id=order.customer_id,
        order_date=order.order_date,
        total_amount=order.total_amount,
        items=[
            schemas.OrderItemResponse(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price
            ) for item in order.items
        ],
        customer_name=order.customer.full_name if order.customer else "Unknown Customer",
        items_detailed=[
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else f"Deleted Product (ID: {item.product_id})",
                "product_sku": item.product.sku if item.product else "N/A",
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.unit_price * item.quantity
            } for item in order.items
        ]
    )

@app.get("/orders", response_model=List[schemas.OrderResponseDetailed])
def get_orders(db: Session = Depends(get_db)):
    db_orders = crud.get_orders(db=db)
    return [enrich_order_response(o) for o in db_orders]

@app.get("/orders/{order_id}", response_model=schemas.OrderResponseDetailed)
def get_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return enrich_order_response(db_order)

@app.delete("/orders/{order_id}")
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    return crud.delete_order(db=db, order_id=order_id)


# --- Dashboard Stats Endpoint ---

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db=db)


# --- Seeding Mock Data ---

@app.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_mock_data(db: Session = Depends(get_db)):
    # Check if database is already seeded
    if db.query(models.Product).first() or db.query(models.Customer).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database already contains products or customers. Seeding aborted."
        )

    # 1. Seed Products
    products = [
        models.Product(name="Mechanical Keyboard", sku="KB-MECH-87", price=89.99, quantity_in_stock=45),
        models.Product(name="Wireless Gaming Mouse", sku="MS-WIRE-G", price=49.99, quantity_in_stock=12),
        models.Product(name="UltraWide Monitor 34\"", sku="MN-UW-34", price=349.99, quantity_in_stock=8), # Low stock (< 10)
        models.Product(name="USB-C Docking Station", sku="DK-USBC-10", price=79.99, quantity_in_stock=4), # Low stock (< 10)
        models.Product(name="Noise Cancelling Headphones", sku="HP-ANC-20", price=199.99, quantity_in_stock=25),
        models.Product(name="Desk Pad Mat", sku="PD-MAT-XL", price=19.99, quantity_in_stock=100)
    ]
    db.add_all(products)
    
    # 2. Seed Customers
    customers = [
        models.Customer(full_name="Jane Doe", email="jane.doe@example.com", phone_number="+1234567890"),
        models.Customer(full_name="John Smith", email="john.smith@gmail.com", phone_number="+1987654321"),
        models.Customer(full_name="Alice Johnson", email="alice.j@outlook.com", phone_number="+14155552671")
    ]
    db.add_all(customers)
    db.commit()

    # Refresh objects to get generated IDs
    for p in products:
        db.refresh(p)
    for c in customers:
        db.refresh(c)

    # 3. Seed Orders
    # Jane places an order for 2 keyboards and 1 desk pad
    order_items_1 = [
        models.OrderItem(product_id=products[0].id, quantity=2, unit_price=products[0].price),
        models.OrderItem(product_id=products[5].id, quantity=1, unit_price=products[5].price)
    ]
    # Update quantities
    products[0].quantity_in_stock -= 2
    products[5].quantity_in_stock -= 1
    
    order_1 = models.Order(
        customer_id=customers[0].id,
        total_amount=(products[0].price * 2) + products[5].price,
        items=order_items_1
    )
    db.add(order_1)

    # John places an order for 1 monitor (low stock) and 1 wireless mouse
    order_items_2 = [
        models.OrderItem(product_id=products[2].id, quantity=1, unit_price=products[2].price),
        models.OrderItem(product_id=products[1].id, quantity=1, unit_price=products[1].price)
    ]
    products[2].quantity_in_stock -= 1
    products[1].quantity_in_stock -= 1

    order_2 = models.Order(
        customer_id=customers[1].id,
        total_amount=products[2].price + products[1].price,
        items=order_items_2
    )
    db.add(order_2)
    db.commit()

    return {"message": "Demo data successfully seeded. Products, Customers, and Orders loaded."}
