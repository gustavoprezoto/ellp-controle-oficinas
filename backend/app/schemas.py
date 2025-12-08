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
    is_completed: Optional[bool] = None
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


# schemas.py (adicione ao final do arquivo)
# Session Schemas
class SessionBase(BaseModel):
    session_date: datetime
    description: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    session_date: Optional[datetime] = None
    description: Optional[str] = None


class Session(SessionBase):
    id: int
    workshop_id: int
    attendances: List["Attendance"] = []
    
    class Config:
        from_attributes = True


# Attendance Schemas
class AttendanceBase(BaseModel):
    is_present: bool = True


class AttendanceCreate(AttendanceBase):
    student_id: int


class AttendanceUpdate(AttendanceBase):
    pass


class Attendance(AttendanceBase):
    id: int
    session_id: int
    student_id: int
    student: Optional["User"] = None
    
    class Config:
        from_attributes = True


class AttendanceBulkCreate(BaseModel):
    attendance: List[AttendanceCreate]


# Workshop with sessions
class WorkshopWithSessions(Workshop):
    sessions: List[Session] = []
    students: List[User] = []


# Statistics
class AttendanceStats(BaseModel):
    total_students: int
    present_count: int
    absent_count: int
    attendance_rate: float


class StudentAttendanceReport(BaseModel):
    student_id: int
    student_name: str
    total_sessions: int
    present_count: int
    attendance_rate: float


class WorkshopAttendanceReport(BaseModel):
    workshop_id: int
    workshop_title: str
    total_sessions: int
    students: List[StudentAttendanceReport]


# Update forward references
Session.update_forward_refs()
Attendance.update_forward_refs()