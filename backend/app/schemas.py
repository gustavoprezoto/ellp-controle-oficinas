from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None  # Adicionar campo de senha para atualização
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Workshop Schemas
class WorkshopBase(BaseModel):
    title: str
    description: Optional[str] = None
    theme: Optional[str] = None
    max_students: int = 20
    prerequisites: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    schedule: Optional[str] = None


class WorkshopCreate(WorkshopBase):
    pass


class WorkshopUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    max_students: Optional[int] = None
    prerequisites: Optional[str] = None
    is_published: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    schedule: Optional[str] = None


class Workshop(WorkshopBase):
    id: int
    professor_id: int
    is_published: bool
    is_completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    available_spots: Optional[int] = None  # Novo campo
    
    class Config:
        from_attributes = True


# Auth Schemas - CORRIGIDO
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Schema para login - ADICIONAR
class LoginRequest(BaseModel):
    email: str
    password: str