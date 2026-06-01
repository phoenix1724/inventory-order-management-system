from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from . import models, schemas

# --- Product CRUD ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.id.asc()).all()

def create_product(db: Session, product: schemas.ProductCreate):
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists."
            )
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
    
    # Check if product is referenced in any order items
    has_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product. It is referenced in existing orders."
        )
        
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully."}


# --- Customer CRUD ---

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.id.asc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )
    
    # Check if customer has active orders
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer. They have placed orders in the system."
        )
        
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully."}


# --- Order CRUD ---

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session):
    return db.query(models.Order).order_by(models.Order.order_date.desc()).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} does not exist."
        )
        
    # We will process everything in a single transaction
    # Since SQLAlchemy has active transactions, we can do it step-by-step.
    # We acquire lock on products to prevent concurrent stock issues.
    db_order_items = []
    total_amount = 0
    
    # Validate products first
    for item in order_data.items:
        # Use with_for_update to lock rows and prevent race conditions
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found."
            )
            
        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for {product.name} (SKU: {product.sku}). Requested: {item.quantity}, Available: {product.quantity_in_stock}."
            )
            
        # Deduct stock atomically
        product.quantity_in_stock -= item.quantity
        
        # Calculate item contribution using database snapshot price
        item_total = product.price * item.quantity
        total_amount += item_total
        
        # Save for later creation
        db_order_items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price
            )
        )
        
    # Create the order
    db_order = models.Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount,
        items=db_order_items
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # Retrieve order with lock to prevent race conditions during deletion
    db_order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )
        
    # Restore stock for each item in the order
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        if product:
            product.quantity_in_stock += item.quantity
            
    db.delete(db_order)
    db.commit()
    return {"message": "Order canceled and stock restored successfully."}


# --- Dashboard Stats ---

def get_dashboard_stats(db: Session):
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    total_customers = db.query(func.count(models.Customer.id)).scalar() or 0
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    
    # Low stock threshold = 10
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock < 10).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
