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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)