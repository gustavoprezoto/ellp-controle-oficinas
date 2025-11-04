from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from . import models, schemas
from .database import SessionLocal, engine, get_db
from .auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
)
from . import users
from . import workshops

# Adicionar import no topo do arquivo
from . users_crud import (
    get_user, get_users, create_user, update_user, delete_user,
    get_users_by_role, authenticate_user
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ELLP Oficinas API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# User Routes
@app.post("/users/", response_model=schemas.User)
def create_user_endpoint(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return users.create_user(db=db, user=user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user


@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = users.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Workshop Routes
@app.post("/workshops/", response_model=schemas.Workshop)
def create_workshop_endpoint(
        workshop: schemas.WorkshopCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "professor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return workshops.create_workshop(db=db, workshop=workshop, professor_id=current_user.id)


@app.get("/workshops/", response_model=List[schemas.Workshop])
def read_workshops(
        skip: int = 0,
        limit: int = 100,
        published_only: bool = False,
        db: Session = Depends(get_db)
):
    return workshops.get_workshops(db, skip=skip, limit=limit, published_only=published_only)


@app.get("/workshops/my-workshops", response_model=List[schemas.Workshop])
def read_my_workshops(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    return workshops.get_user_workshops(db, user_id=current_user.id)


@app.get("/workshops/{workshop_id}", response_model=schemas.Workshop)
def read_workshop(workshop_id: int, db: Session = Depends(get_db)):
    db_workshop = workshops.get_workshop(db, workshop_id=workshop_id)
    if db_workshop is None:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return db_workshop


@app.put("/workshops/{workshop_id}", response_model=schemas.Workshop)
def update_workshop_endpoint(
        workshop_id: int,
        workshop_update: schemas.WorkshopUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    db_workshop = workshops.get_workshop(db, workshop_id)
    if not db_workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")

    if db_workshop.professor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    updated_workshop = workshops.update_workshop(db, workshop_id, workshop_update)
    if not updated_workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return updated_workshop


@app.post("/workshops/{workshop_id}/enroll")
def enroll_in_workshop(
        workshop_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "aluno":
        raise HTTPException(status_code=403, detail="Only students can enroll in workshops")

    try:
        workshop = workshops.enroll_student(db, workshop_id, current_user.id)
        return {"message": "Successfully enrolled in workshop"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/workshops/{workshop_id}/students")
def get_workshop_students_endpoint(
        workshop_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    db_workshop = workshops.get_workshop(db, workshop_id)
    if not db_workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")

    if db_workshop.professor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return workshops.get_workshop_students(db, workshop_id)

@app.delete("/workshops/{workshop_id}")
def delete_workshop_endpoint(
    workshop_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_workshop = workshops.get_workshop(db, workshop_id)
    if not db_workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")
    
    # Verificar se o usuário é o professor da oficina ou admin
    if db_workshop.professor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    success = workshops.delete_workshop(db, workshop_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workshop not found")
    
    return {"message": "Workshop deleted successfully"}


@app.delete("/workshops/{workshop_id}/enroll")
def unenroll_from_workshop(
    workshop_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "aluno":
        raise HTTPException(status_code=403, detail="Only students can unenroll from workshops")
    
    workshop = workshops.get_workshop(db, workshop_id)
    if not workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")
    
    # Verificar se o aluno está inscrito
    if not any(student.id == current_user.id for student in workshop.students):
        raise HTTPException(status_code=400, detail="Student is not enrolled in this workshop")
    
    # Remover aluno da oficina
    workshop.students = [student for student in workshop.students if student.id != current_user.id]
    db.commit()
    
    return {"message": "Successfully unenrolled from workshop"}

@app.get("/users/me/enrollments", response_model=List[schemas.Workshop])
def get_my_enrollments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Retorna todas as oficinas em que o usuário atual está inscrito"""
    if current_user.role != "aluno":
        raise HTTPException(status_code=403, detail="Only students can view enrollments")
    
    # Buscar o usuário com as relações carregadas
    db_user = db.query(models.User).options(
        selectinload(models.User.workshops_enrolled)
    ).filter(models.User.id == current_user.id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"Usuário {db_user.id} está inscrito em {len(db_user.workshops_enrolled)} oficinas")
    
    # Retorna apenas oficinas publicadas
    enrolled_workshops = [workshop for workshop in db_user.workshops_enrolled if workshop.is_published]
    
    return enrolled_workshops

@app.get("/users/me/enrollments-direct")
def get_my_enrollments_direct(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Método alternativo usando query direta na tabela workshop_enrollments"""
    
    # Query direta na tabela de associação
    enrollment_query = db.query(models.Workshop).join(
        models.workshop_enrollments,
        models.Workshop.id == models.workshop_enrollments.c.workshop_id
    ).filter(
        models.workshop_enrollments.c.user_id == current_user.id
    )
    
    workshops = enrollment_query.all()
    print(f"Query direta: usuário {current_user.id} está em {len(workshops)} oficinas")
    
    return workshops


@app.get("/debug/enrollments")
def debug_enrollments(db: Session = Depends(get_db)):
    """Endpoint de debug para ver todas as inscrições"""
    from sqlalchemy import text
    
    # Ver todas as inscrições na tabela workshop_enrollments
    result = db.execute(text("SELECT * FROM workshop_enrollments"))
    enrollments = []
    for row in result:
        enrollments.append({
            'user_id': row[0],
            'workshop_id': row[1]
        })
    
    # Ver todos os usuários
    users = db.query(models.User).all()
    user_list = [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role} for u in users]
    
    # Ver todas as oficinas
    workshops = db.query(models.Workshop).all()
    workshop_list = [{'id': w.id, 'title': w.title, 'professor_id': w.professor_id} for w in workshops]
    
    return {
        'enrollments': enrollments,
        'users': user_list,
        'workshops': workshop_list
    }

    # Get all users
@app.get("/users/", response_model=List[schemas.User])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    users = users_crud.get_users(db, skip=skip, limit=limit)
    return users

# Update user
@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_user = users_crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = users_crud.update_user(db, user_id, user_update)
    return updated_user

# Delete user
@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    success = users_crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# Get student enrollments
@app.get("/users/{user_id}/enrollments", response_model=List[schemas.Workshop])
def get_student_enrollments(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Buscar usuário com suas inscrições
    db_user = db.query(models.User).options(
        selectinload(models.User.workshops_enrolled)
    ).filter(models.User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.role != "aluno":
        raise HTTPException(status_code=400, detail="User is not a student")
    
    return db_user.workshops_enrolled


# Get students only
@app.get("/users/students/", response_model=List[schemas.User])
def get_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    students = users_crud.get_users_by_role(db, role="aluno", skip=skip, limit=limit)
    return students
    
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8145)