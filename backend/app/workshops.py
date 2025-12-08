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


def delete_workshop(db: Session, workshop_id: int):
    db_workshop = get_workshop(db, workshop_id)
    if not db_workshop:
        return False
    
    db.delete(db_workshop)
    db.commit()
    return True

def get_or_create_attendance_summary(db: Session, workshop_id: int, student_id: int) -> models.AttendanceSummary:
    summary = (
        db.query(models.AttendanceSummary)
        .filter(
            models.AttendanceSummary.workshop_id == workshop_id,
            models.AttendanceSummary.student_id == student_id,
        )
        .first()
    )
    if not summary:
        summary = models.AttendanceSummary(
            workshop_id=workshop_id,
            student_id=student_id,
            total_classes=0,
            absences=0,
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
    return summary


def get_workshop_attendance(db: Session, workshop_id: int) -> list[schemas.WorkshopAttendanceStudent]:
    workshop = get_workshop(db, workshop_id)
    if not workshop:
        return None

    # mapa student_id -> summary
    summaries = {
        s.student_id: s
        for s in db.query(models.AttendanceSummary)
        .filter(models.AttendanceSummary.workshop_id == workshop_id)
        .all()
    }

    result = []
    for student in workshop.students:
        summary = summaries.get(student.id)
        total_classes = summary.total_classes if summary else 0
        absences = summary.absences if summary else 0

        if total_classes > 0:
            presence_percentage = (total_classes - absences) / float(total_classes)
        else:
            presence_percentage = 0.0

        result.append(
            schemas.WorkshopAttendanceStudent(
                student_id=student.id,
                student_name=student.name,
                total_classes=total_classes,
                absences=absences,
                presence_percentage=presence_percentage,
            )
        )
    return result


def update_workshop_attendance(
    db: Session,
    workshop_id: int,
    attendance_update: schemas.WorkshopAttendanceUpdateRequest,
):
    workshop = get_workshop(db, workshop_id)
    if not workshop:
        return None

    for item in attendance_update.students:
        summary = get_or_create_attendance_summary(
            db, workshop_id=workshop_id, student_id=item.student_id
        )
        summary.total_classes = max(0, item.total_classes)
        summary.absences = max(0, item.absences)
        db.add(summary)

    db.commit()
    return get_workshop_attendance(db, workshop_id)


def mark_workshop_completed(db: Session, workshop_id: int):
    workshop = get_workshop(db, workshop_id)
    if not workshop:
        return None
    workshop.is_completed = True
    db.add(workshop)
    db.commit()
    db.refresh(workshop)
    return workshop


def user_can_get_certificate(db: Session, workshop_id: int, user_id: int) -> bool:
    workshop = get_workshop(db, workshop_id)
    if not workshop or not workshop.is_completed:
        return False

    summary = (
        db.query(models.AttendanceSummary)
        .filter(
            models.AttendanceSummary.workshop_id == workshop_id,
            models.AttendanceSummary.student_id == user_id,
        )
        .first()
    )
    if not summary or summary.total_classes <= 0:
        return False

    presence_percentage = (summary.total_classes - summary.absences) / float(
        summary.total_classes
    )
    return presence_percentage >= 0.5