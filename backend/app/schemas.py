from pydantic import BaseModel, EmailStr, Field
from decimal import Decimal
from datetime import datetime
from typing import List, Optional

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the product")
    sku: str = Field(..., min_length=1, description="Case-sensitive unique stock keeping unit code")
    price: Decimal = Field(..., gt=0, description="Positive decimal value representing unit price")
    quantity_in_stock: int = Field(..., ge=0, description="Non-negative integer indicating current inventory count")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    sku: Optional[str] = Field(None, min_length=1)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# --- Customer Schemas ---
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Full name of customer")
    email: EmailStr = Field(..., description="Unique customer email address")
    phone_number: Optional[str] = Field(None, description="Optional customer phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_length=1)

class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    order_date: datetime
    total_amount: Decimal
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderResponseDetailed(OrderResponse):
    customer_name: str
    items_detailed: List[dict] # Custom extension for detailed lists


# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]
