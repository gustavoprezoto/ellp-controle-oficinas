import pytest
from app import users_crud, workshops, schemas, models

def test_get_non_existent_user(db_session):
    user = users_crud.get_user(db_session, 9999)
    assert user is None

def test_get_users_pagination(db_session):
    # Cria 3 usuários
    for i in range(3):
        users_crud.create_user(db_session, schemas.UserCreate(email=f"u{i}@t.com", name=f"U{i}", password="1", role="aluno"))
    
    users = users_crud.get_users(db_session, limit=2)
    assert len(users) == 2

def test_get_users_by_role(db_session):
    users_crud.create_user(db_session, schemas.UserCreate(email="adm@t.com", name="A", password="1", role="admin"))
    users_crud.create_user(db_session, schemas.UserCreate(email="alu@t.com", name="B", password="1", role="aluno"))
    
    admins = users_crud.get_users_by_role(db_session, role="admin")
    assert len(admins) == 1
    assert admins[0].email == "adm@t.com"

def test_change_user_password(db_session):
    user = users_crud.create_user(db_session, schemas.UserCreate(email="pw@t.com", name="P", password="old", role="aluno"))
    success = users_crud.change_user_password(db_session, user.id, "newpassword")
    
    assert success is True
    updated_user = users_crud.get_user(db_session, user.id)
    # Verifica se a nova senha funciona (hash bate)
    auth = users_crud.authenticate_user(db_session, "pw@t.com", "newpassword")
    assert auth is not False

def test_deactivate_user(db_session):
    user = users_crud.create_user(db_session, schemas.UserCreate(email="act@t.com", name="A", password="1", role="aluno"))
    users_crud.deactivate_user(db_session, user.id)
    
    db_user = users_crud.get_user(db_session, user.id)
    assert db_user.is_active is False

def test_activate_user(db_session):
    user = users_crud.create_user(db_session, schemas.UserCreate(email="inact@t.com", name="A", password="1", role="aluno"))
    users_crud.deactivate_user(db_session, user.id)
    users_crud.activate_user(db_session, user.id)
    
    db_user = users_crud.get_user(db_session, user.id)
    assert db_user.is_active is True

def test_get_workshops_published_only(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    
    # Cria um publicado e um não publicado
    ws1 = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Pub"), prof.id) # Default is True
    ws2_in = schemas.WorkshopCreate(title="Priv")
    ws2 = workshops.create_workshop(db_session, ws2_in, prof.id)
    
    # Atualiza ws2 para não publicado
    workshops.update_workshop(db_session, ws2.id, schemas.WorkshopUpdate(is_published=False))
    
    published = workshops.get_workshops(db_session, published_only=True)
    assert len(published) == 1
    assert published[0].title == "Pub"

def test_delete_workshop(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Del"), prof.id)
    
    assert workshops.delete_workshop(db_session, ws.id) is True
    assert workshops.get_workshop(db_session, ws.id) is None

def test_enroll_student_workshop_full(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Full", max_students=1), prof.id)
    
    s1 = users_crud.create_user(db_session, schemas.UserCreate(email="s1@t.com", name="S1", password="1", role="aluno"))
    s2 = users_crud.create_user(db_session, schemas.UserCreate(email="s2@t.com", name="S2", password="1", role="aluno"))
    
    workshops.enroll_student(db_session, ws.id, s1.id)
    
    with pytest.raises(ValueError, match="Workshop is full"):
        workshops.enroll_student(db_session, ws.id, s2.id)

def test_enroll_student_already_enrolled(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Dup"), prof.id)
    s1 = users_crud.create_user(db_session, schemas.UserCreate(email="s1@t.com", name="S1", password="1", role="aluno"))
    
    workshops.enroll_student(db_session, ws.id, s1.id)
    
    with pytest.raises(ValueError, match="Student already enrolled"):
        workshops.enroll_student(db_session, ws.id, s1.id)

def test_mark_workshop_completed(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Comp"), prof.id)
    
    completed = workshops.mark_workshop_completed(db_session, ws.id)
    assert completed.is_completed is True

def test_user_can_get_certificate_success(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    student = users_crud.create_user(db_session, schemas.UserCreate(email="s@t.com", name="S", password="1", role="aluno"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Cert"), prof.id)
    
    workshops.enroll_student(db_session, ws.id, student.id)
    workshops.mark_workshop_completed(db_session, ws.id)
    
    # Cria presença 100%
    summary = models.AttendanceSummary(workshop_id=ws.id, student_id=student.id, total_classes=10, absences=0)
    db_session.add(summary)
    db_session.commit()
    
    assert workshops.user_can_get_certificate(db_session, ws.id, student.id) is True

def test_user_can_get_certificate_fail_attendance(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    student = users_crud.create_user(db_session, schemas.UserCreate(email="s@t.com", name="S", password="1", role="aluno"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="NoCert"), prof.id)
    
    workshops.enroll_student(db_session, ws.id, student.id)
    workshops.mark_workshop_completed(db_session, ws.id)
    
    # Presença baixa (10 aulas, 8 faltas = 20%)
    summary = models.AttendanceSummary(workshop_id=ws.id, student_id=student.id, total_classes=10, absences=8)
    db_session.add(summary)
    db_session.commit()
    
    assert workshops.user_can_get_certificate(db_session, ws.id, student.id) is False

def test_user_can_get_certificate_fail_not_completed(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    student = users_crud.create_user(db_session, schemas.UserCreate(email="s@t.com", name="S", password="1", role="aluno"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="NotDone"), prof.id)
    
    workshops.enroll_student(db_session, ws.id, student.id)
    
    # Presença boa, mas curso não acabou
    summary = models.AttendanceSummary(workshop_id=ws.id, student_id=student.id, total_classes=10, absences=0)
    db_session.add(summary)
    db_session.commit()
    
    assert workshops.user_can_get_certificate(db_session, ws.id, student.id) is False

def test_update_workshop_attendance_bulk(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    s1 = users_crud.create_user(db_session, schemas.UserCreate(email="s1@t.com", name="S1", password="1", role="aluno"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Bulk"), prof.id)
    workshops.enroll_student(db_session, ws.id, s1.id)
    
    update_data = schemas.WorkshopAttendanceUpdateRequest(
        students=[
            schemas.WorkshopAttendanceStudentUpdate(student_id=s1.id, total_classes=5, absences=1)
        ]
    )
    
    result = workshops.update_workshop_attendance(db_session, ws.id, update_data)
    assert result[0].total_classes == 5
    assert result[0].absences == 1