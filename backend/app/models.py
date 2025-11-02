from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

workshop_enrollments = Table(
    'workshop_enrollments',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('workshop_id', Integer, ForeignKey('workshops.id'))
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workshops_teaching = relationship("Workshop", back_populates="professor")
    workshops_enrolled = relationship("Workshop", secondary=workshop_enrollments, back_populates="students")


class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    theme = Column(String(255))
    max_students = Column(Integer, default=20)
    prerequisites = Column(Text)
    is_published = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    professor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    schedule = Column(Text)

    professor = relationship("User", back_populates="workshops_teaching")
    students = relationship("User", secondary=workshop_enrollments, back_populates="workshops_enrolled")
    sessions = relationship("Session", back_populates="workshop")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    workshop_id = Column(Integer, ForeignKey("workshops.id"))
    session_date = Column(DateTime(timezone=True))
    description = Column(String(255))

    workshop = relationship("Workshop", back_populates="sessions")
    attendances = relationship("Attendance", back_populates="session")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    is_present = Column(Boolean, default=False)

    session = relationship("Session", back_populates="attendances")