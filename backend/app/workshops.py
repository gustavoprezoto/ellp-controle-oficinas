from sqlalchemy.orm import Session

from . import models, schemas

def get_workshop(db: Session, workshop_id: int):
    return db.query(models.Workshop).filter(models.Workshop.id == workshop_id).first()


def get_workshops(db: Session, skip: int = 0, limit: int = 100, published_only: bool = False):
    query = db.query(models.Workshop)
    if published_only:
        query = query.filter(models.Workshop.is_published == True)
    return query.offset(skip).limit(limit).all()


def get_user_workshops(db: Session, user_id: int):
    return db.query(models.Workshop).filter(models.Workshop.professor_id == user_id).all()


def create_workshop(db: Session, workshop: schemas.WorkshopCreate, professor_id: int):
    db_workshop = models.Workshop(
        **workshop.dict(),
        professor_id=professor_id
    )
    db.add(db_workshop)
    db.commit()
    db.refresh(db_workshop)
    return db_workshop


def update_workshop(db: Session, workshop_id: int, workshop_update: schemas.WorkshopUpdate):
    db_workshop = get_workshop(db, workshop_id)
    if not db_workshop:
        return None

    update_data = workshop_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_workshop, field, value)

    db.commit()
    db.refresh(db_workshop)
    return db_workshop


def delete_workshop(db: Session, workshop_id: int):
    db_workshop = get_workshop(db, workshop_id)
    if not db_workshop:
        return False

    db.delete(db_workshop)
    db.commit()
    return True


def enroll_student(db: Session, workshop_id: int, student_id: int):
    workshop = get_workshop(db, workshop_id)
    if not workshop:
        return None

    if len(workshop.students) >= workshop.max_students:
        raise ValueError("Workshop is full")

    if any(student.id == student_id for student in workshop.students):
        raise ValueError("Student already enrolled")

    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise ValueError("Student not found")

    workshop.students.append(student)
    db.commit()
    return workshop


def get_workshop_students(db: Session, workshop_id: int):
    workshop = get_workshop(db, workshop_id)
    if not workshop:
        return None
    return workshop.students