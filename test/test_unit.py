import jwt
from app.auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

def test_hash_password_consistency():
    password = "minha_senha_secreta"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)
    assert hash1 == hash2

def test_verify_password_success():
    password = "senha123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True

def test_verify_password_failure():
    password = "senha123"
    hashed = get_password_hash(password)
    assert verify_password("senha_errada", hashed) is False

def test_create_access_token_structure():
    data = {"sub": "teste@email.com"}
    token = create_access_token(data=data)
    
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "teste@email.com"
    assert "exp" in decoded