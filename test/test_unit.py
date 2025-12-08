from datetime import datetime, timedelta
from app.schemas import UserCreate, WorkshopCreate, WorkshopUpdate, AttendanceStats
from app.auth import get_password_hash, verify_password, create_access_token, ALGORITHM, SECRET_KEY
import jwt

def test_verify_password_special_chars():
    password = "!@#$%^&*()_+"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True

def test_verify_password_empty_string():
    hashed = get_password_hash("secret")
    assert verify_password("", hashed) is False

def test_hash_is_deterministic():
    # SHA256 simples sem salt aleatório gera sempre o mesmo hash
    p = "teste"
    assert get_password_hash(p) == get_password_hash(p)

def test_token_custom_expiration():
    delta = timedelta(minutes=60)
    token = create_access_token({"sub": "test"}, expires_delta=delta)
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    # Verifica se exp existe e é maior que agora
    assert decoded["exp"] > datetime.utcnow().timestamp()

def test_token_invalid_algorithm():
    # Tenta decodificar com algoritmo errado deve falhar
    token = create_access_token({"sub": "test"})
    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS512"])
        assert False
    except jwt.PyJWTError:
        assert True

def test_user_schema_email_validation():
    user = UserCreate(email="valid@email.com", name="Test", password="123", role="aluno")
    assert user.email == "valid@email.com"

def test_workshop_create_defaults():
    ws = WorkshopCreate(title="Test Workshop")
    assert ws.max_students == 20  # Valor padrão

def test_workshop_update_partial():
    update = WorkshopUpdate(title="New Title")
    assert update.title == "New Title"
    assert update.description is None

def test_workshop_update_fields():
    update = WorkshopUpdate(is_published=True, max_students=30)
    assert update.is_published is True
    assert update.max_students == 30

def test_attendance_stats_calculation():
    stats = AttendanceStats(
        total_students=10,
        present_count=8,
        absent_count=2,
        attendance_rate=0.8
    )
    assert stats.attendance_rate == 0.8

def test_user_role_assignment():
    user = UserCreate(email="a@a.com", name="A", password="p", role="admin")
    assert user.role == "admin"

def test_create_token_extra_fields():
    token = create_access_token({"sub": "user", "role": "admin"})
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["role"] == "admin"

def test_password_hash_length():
    # SHA256 hexdigest tem 64 caracteres
    hashed = get_password_hash("abc")
    assert len(hashed) == 64

def test_workshop_date_parsing():
    date_now = datetime.now()
    ws = WorkshopCreate(title="Date Test", start_date=date_now)
    assert ws.start_date == date_now

def test_token_decode_expired_simulated():
    # Cria token expirado manualmente
    payload = {"sub": "test", "exp": datetime.utcnow() - timedelta(minutes=1)}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert False
    except jwt.ExpiredSignatureError:
        assert True