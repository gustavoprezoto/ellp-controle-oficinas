from app import users_crud, workshops, schemas, models

def test_create_and_retrieve_user(db_session):
    user_in = schemas.UserCreate(
        email="test_crud@example.com",
        name="Test User",
        password="secretpassword",
        role="aluno"
    )
    user = users_crud.create_user(db_session, user_in)
    
    assert user.email == "test_crud@example.com"
    stored_user = users_crud.get_user(db_session, user.id)
    assert stored_user.name == "Test User"
    

def test_authenticate_user_logic(db_session):
    user_in = schemas.UserCreate(
        email="auth_test@example.com",
        name="Auth User",
        password="mypassword",
        role="aluno"
    )
    users_crud.create_user(db_session, user_in)
    
    authenticated = users_crud.authenticate_user(db_session, "auth_test@example.com", "mypassword")
    assert authenticated is not False
    
    failed = users_crud.authenticate_user(db_session, "auth_test@example.com", "wrong")
    assert failed is False

def test_update_user_fields(db_session):
    user_in = schemas.UserCreate(
        email="update@example.com",
        name="Original",
        password="123",
        role="professor"
    )
    user = users_crud.create_user(db_session, user_in)
    
    update_data = schemas.UserUpdate(name="Updated")
    updated_user = users_crud.update_user(db_session, user.id, update_data)
    
    assert updated_user.name == "Updated"

def test_create_workshop_logic(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    
    workshop_in = schemas.WorkshopCreate(
        title="Unit Testing",
        max_students=10
    )
    
    workshop = workshops.create_workshop(db_session, workshop_in, prof.id)
    
    assert workshop.title == "Unit Testing"
    assert workshop.professor_id == prof.id

def test_enroll_student_logic(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p@t.com", name="P", password="1", role="professor"))
    student = users_crud.create_user(db_session, schemas.UserCreate(email="s@t.com", name="S", password="1", role="aluno"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="WS", max_students=5), prof.id)
    
    enrolled_ws = workshops.enroll_student(db_session, ws.id, student.id)
    
    assert len(enrolled_ws.students) == 1
    assert enrolled_ws.students[0].id == student.id

def test_attendance_calculation_logic(db_session):
    prof = users_crud.create_user(db_session, schemas.UserCreate(email="p2@t.com", name="P2", password="1", role="professor"))
    student = users_crud.create_user(db_session, schemas.UserCreate(email="s2@t.com", name="S2", password="1", role="aluno"))
    ws = workshops.create_workshop(db_session, schemas.WorkshopCreate(title="Math", max_students=5), prof.id)
    workshops.enroll_student(db_session, ws.id, student.id)
    
    summary = models.AttendanceSummary(
        workshop_id=ws.id,
        student_id=student.id,
        total_classes=10,
        absences=2
    )
    db_session.add(summary)
    db_session.commit()
    
    attendance_list = workshops.get_workshop_attendance(db_session, ws.id)
    
    assert attendance_list[0].presence_percentage == 0.8

def test_delete_user_logic(db_session):
    user = users_crud.create_user(db_session, schemas.UserCreate(email="del@test.com", name="Del", password="1", role="aluno"))
    
    success = users_crud.delete_user(db_session, user.id)
    assert success is True
    
    assert users_crud.get_user(db_session, user.id) is None